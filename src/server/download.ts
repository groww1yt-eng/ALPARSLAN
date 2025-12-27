import { execSync, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { registerDownload, updateProgress, completeDownload, failDownload } from './downloadManager.js';

export interface DownloadResult {
  success: boolean;
  filePath: string;
  fileName: string;
  fileSize: string; // in MB
}

export interface DownloadOptions {
  url: string;
  videoId: string;
  jobId?: string;
  outputFolder: string;
  mode: 'video' | 'audio';
  quality?: string;
  format?: string;
  fileSize?: number;
  onProgress?: (progress: number) => void;
}

// Get total file size using yt-dlp
export async function getFileSize(url: string, mode: 'video' | 'audio', quality: string = '1080p'): Promise<number> {
  try {
    let ytdlpArgs: string[] = ['-j'];

    if (mode === 'audio') {
      ytdlpArgs.push('-x');
      ytdlpArgs.push('--audio-format=mp3');
    } else {
      const qualityMap: Record<string, string> = {
        '2160p': 'bestvideo[height<=2160][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
        '1440p': 'bestvideo[height<=1440][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
        '1080p': 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
        '720p': 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
        '480p': 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
        '360p': 'bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
        'highest': 'best[ext=mp4]',
      };
      const formatStr = qualityMap[quality] || qualityMap['1080p'];
      ytdlpArgs.push('-f', formatStr);
      // Add remux in size calculation too to match actual download
      ytdlpArgs.push('--remux-video=mp4');
    }

    ytdlpArgs.push('--skip-download');
    ytdlpArgs.push(url);

    const command = `python -m yt_dlp ${ytdlpArgs.map(arg => `"${arg}"`).join(' ')}`;
    const output = execSync(command, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
    
    try {
      const info = JSON.parse(output);
      // Return filesize or fall back to filesize_approx
      // These are in bytes
      return info.filesize || info.filesize_approx || 0;
    } catch {
      return 0; // Return 0 if we can't parse, download will proceed anyway
    }
  } catch (error) {
    console.error('Error getting file size:', error);
    return 0; // Return 0 if we can't get size
  }
}

// Sanitize filename - replace illegal characters
function sanitizeFilename(filename: string): string {
  // Replace illegal characters
  const illegalChars: Record<string, string> = {
    ':': ' - ',
    '/': '_',
    '\\': '_',
    '?': '',
    '"': "'",
    '<': '[',
    '>': ']',
    '|': '-',
    '*': '_',
  };

  let sanitized = filename;
  for (const [illegal, replacement] of Object.entries(illegalChars)) {
    sanitized = sanitized.replace(new RegExp(`[${illegal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`, 'g'), replacement);
  }

  // Remove trailing dots and spaces
  sanitized = sanitized.replace(/[\s.]+$/, '');

  return sanitized;
}

// Handle duplicate filenames - ONLY append if file already exists
function getUniqueFilename(filePath: string): string {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const basename = path.basename(filePath, ext);

  // If file doesn't exist, return as is (no duplicate)
  if (!fs.existsSync(filePath)) {
    return filePath;
  }

  // File exists, so start appending numbers
  let counter = 2;
  while (true) {
    const newName = `${basename} (${counter})${ext}`;
    const newPath = path.join(dir, newName);
    if (!fs.existsSync(newPath)) {
      return newPath;
    }
    counter++;
  }
}

export async function downloadVideo(options: DownloadOptions): Promise<DownloadResult> {
  const { url, videoId, jobId, outputFolder, mode, quality = '1080p', format = 'mp3', fileSize = 0 } = options;

  // Ensure output folder exists
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  try {
    let ytdlpArgs: string[] = [];

    if (mode === 'audio') {
      ytdlpArgs.push('-x'); // Extract audio
      ytdlpArgs.push(`--audio-format=${format}`);
      ytdlpArgs.push('--audio-quality=0'); // Best quality
    } else {
      // Video download with quality - ONLY MP4 format
      const qualityMap: Record<string, string> = {
        '2160p': 'bestvideo[height<=2160][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
        '1440p': 'bestvideo[height<=1440][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
        '1080p': 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
        '720p': 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
        '480p': 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
        '360p': 'bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
        'highest': 'best[ext=mp4]',
      };
      const formatStr = qualityMap[quality] || qualityMap['1080p'];
      ytdlpArgs.push('-f', formatStr);
      ytdlpArgs.push('--remux-video=mp4');
    }

    // Output template with sanitized filename
    const outputTemplate = path.join(outputFolder, '%(title)s.%(ext)s');
    ytdlpArgs.push('-o', outputTemplate);
    ytdlpArgs.push('--no-warnings');

    // URL
    ytdlpArgs.push(url);

    // Build command
    const command = `python -m yt_dlp ${ytdlpArgs.map(arg => `"${arg}"`).join(' ')}`;

    console.log(`Starting download: ${url}`);
    console.log(`Mode: ${mode}, Quality: ${quality}, Format: ${format}`);

    // Register download with manager - use the actual estimated file size (in bytes)
    if (jobId) {
      registerDownload(jobId, videoId, path.join(outputFolder, 'downloading'), fileSize || 0);
    }

    // Start progress tracking in background while download runs
    let progressInterval: NodeJS.Timeout | null = null;
    if (jobId && fileSize > 0) {
      progressInterval = setInterval(() => {
        try {
          // Check for downloading files in the output folder
          const files = fs.readdirSync(outputFolder);
          for (const file of files) {
            const filePath = path.join(outputFolder, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile() && stats.mtimeMs > Date.now() - 30000) { // Recently modified (within 30 sec)
              // Update progress based on actual bytes downloaded
              updateProgress(jobId, stats.size);
            }
          }
        } catch (err) {
          // Silently fail, progress update is best-effort
        }
      }, 500); // Check every 500ms
    }

    // Execute download synchronously (blocking, but reliable)
    execSync(command, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Stop progress tracking
    if (progressInterval) {
      clearInterval(progressInterval);
    }

    console.log('✅ Download Completed Successfully');

    // Find the downloaded file and apply duplicate handling
    const files = fs.readdirSync(outputFolder);
    let downloadedFile: string | null = null;

    // Get the most recently modified file
    let latestTime = 0;
    for (const file of files) {
      const filePath = path.join(outputFolder, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile() && stats.mtimeMs > latestTime) {
        latestTime = stats.mtimeMs;
        downloadedFile = filePath;
      }
    }

    if (downloadedFile) {
      // Sanitize and apply duplicate handling
      const originalName = path.basename(downloadedFile);
      const sanitized = sanitizeFilename(originalName);
      const sanitizedPath = path.join(outputFolder, sanitized);

      let finalPath = downloadedFile;

      // Check if we need to rename due to sanitization
      if (sanitized !== originalName) {
        // File needs sanitization - check if sanitized version already exists
        if (fs.existsSync(sanitizedPath) && sanitizedPath !== downloadedFile) {
          // Get unique name for the sanitized version
          const uniquePath = getUniqueFilename(sanitizedPath);
          fs.renameSync(downloadedFile, uniquePath);
          console.log(`Renamed file due to sanitization: ${originalName} -> ${path.basename(uniquePath)}`);
          finalPath = uniquePath;
        } else {
          // Sanitized path doesn't conflict, just rename to it
          fs.renameSync(downloadedFile, sanitizedPath);
          console.log(`Renamed file: ${originalName} -> ${sanitized}`);
          finalPath = sanitizedPath;
        }
      } else {
        // File doesn't need sanitization
        // Only check for duplicates if previous numbered versions exist
        const ext = path.extname(originalName);
        const baseWithoutExt = originalName.slice(0, -ext.length);
        
        // Check if ANY numbered version exists (like (2), (3), etc)
        let foundExistingNumbers = false;
        for (let i = 2; i <= 100; i++) {
          const numberedName = `${baseWithoutExt} (${i})${ext}`;
          if (fs.existsSync(path.join(outputFolder, numberedName))) {
            foundExistingNumbers = true;
            break;
          }
        }
        
        // Only apply duplicate handling if numbered versions already exist
        if (foundExistingNumbers) {
          const uniquePath = getUniqueFilename(downloadedFile);
          if (uniquePath !== downloadedFile) {
            fs.renameSync(downloadedFile, uniquePath);
            console.log(`Renamed file to avoid duplicate: ${originalName} -> ${path.basename(uniquePath)}`);
            finalPath = uniquePath;
          }
        }
      }

      // Get file size in MB
      const stats = fs.statSync(finalPath);
      const fileSizeBytes = stats.size;
      const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);

      if (jobId) {
        // Update the download manager with actual final file size
        // This ensures progress bar reaches 100% with the real file size
        completeDownload(jobId, fileSizeBytes);
      }

      return {
        success: true,
        filePath: finalPath,
        fileName: path.basename(finalPath),
        fileSize: `${fileSizeMB} MB`,
      };
    }

    if (jobId) failDownload(jobId);
    throw new Error('No file was downloaded');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Download failed';
    if (jobId) failDownload(jobId, message);
    throw new Error(`Failed to download video: ${message}`);
  }
}

export function getDownloadedFiles(outputFolder: string, videoTitle: string): string[] {
  try {
    if (!fs.existsSync(outputFolder)) {
      return [];
    }

    const files = fs.readdirSync(outputFolder);
    // Filter files that match the video title (roughly)
    return files.filter(file => {
      const filePath = path.join(outputFolder, file);
      return fs.statSync(filePath).isFile();
    });
  } catch (error) {
    console.error('Error reading output folder:', error);
    return [];
  }
}
