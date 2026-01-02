import { execSync, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import {
  registerDownload,
  updateProgress,
  completeDownload,
  failDownload,
  setDownloadProcess,
  getDownloadProgress,
  setStageTotalBytes,
  setStage
} from './downloadManager.js';

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
  resolvedFilename?: string; // Final filename without extension (from naming resolver)
  onProgress?: (progress: number) => void;
  downloadSubtitles?: boolean;
  subtitleLanguage?: 'auto' | 'en';
  createPerChannelFolder?: boolean;
  channel?: string;
}

// Get total file size using yt-dlp
export async function getFileSize(url: string, mode: 'video' | 'audio', quality: string = '1080p', playlistItems?: string): Promise<number> {
  try {
    let ytdlpArgs: string[] = ['-j'];

    if (playlistItems) {
      ytdlpArgs.push('--playlist-items', playlistItems);
    }

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
    ytdlpArgs.push('--ignore-errors'); // Don't fail entire batch if one is private
    ytdlpArgs.push('--no-warnings');   // Reduce noise
    ytdlpArgs.push(url);

    const command = `python -m yt_dlp ${ytdlpArgs.map(arg => `"${arg}"`).join(' ')}`;

    let output = '';
    try {
      output = execSync(command, { encoding: 'utf-8', maxBuffer: 100 * 1024 * 1024 });
    } catch (error: any) {
      // If yt-dlp exits with error (e.g. private video), it might still have output valid JSON for others
      if (error.stdout) {
        console.warn('yt-dlp exited with error but returned stdout (likely private videos), continuing parsing...');
        output = error.stdout.toString();
      } else {
        console.error('Error getting file size (no stdout):', error.message);
        return 0;
      }
    }

    try {
      // Split by newline and parse each line (for playlists)
      const lines = output.trim().split('\n');
      let total = 0;

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const info = JSON.parse(line);
          total += info.filesize || info.filesize_approx || 0;
        } catch (e) {
          // Ignore parse errors for non-JSON lines (warnings etc)
        }
      }
      return total;
    } catch (parseError) {
      console.error('Global parse error in getFileSize:', parseError);
      return 0;
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
  const { url, videoId, jobId, outputFolder, mode, quality = '1080p', format = 'mp3', fileSize = 0, resolvedFilename, downloadSubtitles, subtitleLanguage, createPerChannelFolder, channel } = options;

  let effectiveOutputFolder = outputFolder;
  if (createPerChannelFolder && channel) {
    const sanitizedChannel = sanitizeFilename(channel);
    effectiveOutputFolder = path.join(outputFolder, sanitizedChannel);
  }

  // Ensure output folder exists
  if (!fs.existsSync(effectiveOutputFolder)) {
    fs.mkdirSync(effectiveOutputFolder, { recursive: true });
  }

  // Register with manager immediately
  if (jobId) {
    registerDownload(jobId, options);
  }

  return new Promise((resolve, reject) => {
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

    // Subtitles
    if (mode === 'video' && downloadSubtitles) {
      ytdlpArgs.push('--embed-subs');
      // --ignore-errors is already handled globally if needed, by passing specific flags to yt-dlp
      // or relying on default behavior. We want to ensure it doesn't fail on missing subs.

      if (subtitleLanguage === 'en') {
        ytdlpArgs.push('--sub-langs', 'en.*');
      }
      // For 'auto', we don't add --sub-langs, or we let yt-dlp decide (usually gets all/auto).
    }

    // Use temp filename during download, will rename to resolved filename after completion
    // This ensures we don't have partial files with final names
    const tempBasename = jobId ? `${jobId}.temp` : `${crypto.randomUUID()}.temp`;
    const outputTemplate = path.join(effectiveOutputFolder, `${tempBasename}.%(ext)s`);
    ytdlpArgs.push('-o', outputTemplate);
    ytdlpArgs.push('--no-warnings');
    ytdlpArgs.push('--newline'); // Important for parsing progress

    // URL
    ytdlpArgs.push(url);

    console.log(`Starting download (spawn): ${url}`);
    console.log(`Mode: ${mode}, Quality: ${quality}, Format: ${format}`);

    // Spawn process
    const pythonProcess = spawn('python', ['-m', 'yt_dlp', ...ytdlpArgs]);

    if (jobId) {
      // Store process reference
      setDownloadProcess(jobId, pythonProcess);
    }

    let downloadOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;

        console.log(`[yt-dlp ${jobId}] ${line.trim()}`);

        // Detect stage changes from destination lines
        // [download] Destination: ...f398.mp4 = video
        // [download] Destination: ...m4a = audio
        if (jobId && line.includes('[download]') && line.includes('Destination:')) {
          if (line.includes('.mp4') && !line.includes('.m4a')) {
            setStage(jobId, 'video');
          } else if (line.includes('.m4a') || line.includes('.mp3') || line.includes('.opus')) {
            setStage(jobId, 'audio');
          }
        }

        // Detect merge stage
        if (jobId && line.includes('[Merger]')) {
          setStage(jobId, 'merging');
        }

        // Parse progress
        // [download]  12.3% of  100.00MiB at  2.50MiB/s ETA 00:35
        if (line.includes('[download]') && line.includes('%')) {
          const percentMatch = line.match(/(\d+\.?\d*)%/);
          const sizeMatch = line.match(/of\s+~?(\d+\.?\d*)([KMGTP]?i?B)/i);
          const speedMatch = line.match(/at\s+(\d+\.?\d*)([KMGTP]?i?B)\/s/i);
          const etaMatch = line.match(/ETA\s+(\d{2}:\d{2}(:\d{2})?)/);

          if (jobId) {
            // We rely on what yt-dlp tells us

            if (sizeMatch && percentMatch) {
              const totalStr = sizeMatch[1];
              const unit = sizeMatch[2];
              let totalBytes = parseFloat(totalStr);

              // Simple unit check
              if (unit.includes('Ki') || unit.includes('KiB')) totalBytes *= 1024;
              else if (unit.includes('Mi') || unit.includes('MiB')) totalBytes *= 1024 ** 2;
              else if (unit.includes('Gi') || unit.includes('GiB')) totalBytes *= 1024 ** 3;

              // Set stage total bytes (this is additive across stages)
              setStageTotalBytes(jobId, totalBytes);

              const percentage = parseFloat(percentMatch[1]);
              const downloadedBytes = (totalBytes * percentage) / 100;

              updateProgress(jobId, downloadedBytes);
            }
          }
        }
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`[yt-dlp error] ${data.toString()}`);
    });

    pythonProcess.on('close', (code) => {
      // CRITICAL: Check pause/cancel status FIRST before any other processing
      // This must happen before checking exit code because SIGKILL can cause code=0
      if (jobId) {
        const progress = getDownloadProgress(jobId);
        if (progress && (progress.status === 'paused' || progress.status === 'canceled')) {
          console.log(`Download ${jobId} was ${progress.status}, not completing.`);
          reject(new Error(progress.status === 'paused' ? 'Download paused' : 'Download canceled'));
          return;
        }
      }

      if (code === 0) {
        // Success - but only if not paused/canceled (already checked above)
        console.log('✅ Download process completed');

        // Find the temp file we just downloaded
        try {
          const files = fs.readdirSync(effectiveOutputFolder);
          let downloadedFile: string | null = null;

          // Look for our temp file (matches jobId.temp.* pattern)
          for (const file of files) {
            // Skip .part files - these are incomplete
            if (file.endsWith('.part')) continue;

            // Match our temp file pattern
            if (file.startsWith(tempBasename)) {
              downloadedFile = path.join(effectiveOutputFolder, file);
              break;
            }
          }

          // Fallback: find most recently modified file (for compatibility)
          if (!downloadedFile) {
            let latestTime = 0;
            for (const file of files) {
              if (file.endsWith('.part')) continue;
              const filePath = path.join(effectiveOutputFolder, file);
              const stats = fs.statSync(filePath);
              if (stats.isFile() && stats.mtimeMs > latestTime) {
                latestTime = stats.mtimeMs;
                downloadedFile = filePath;
              }
            }
          }

          if (downloadedFile) {
            // Get the extension from the downloaded file
            const downloadedExt = path.extname(downloadedFile);
            let finalPath = downloadedFile;

            // If we have a resolved filename, rename to it
            if (resolvedFilename) {
              const targetName = `${resolvedFilename}${downloadedExt}`;
              const targetPath = path.join(effectiveOutputFolder, targetName);
              // Use getUniqueFilename to handle duplicates
              finalPath = getUniqueFilename(targetPath);

              console.log(`Renaming: ${path.basename(downloadedFile)} -> ${path.basename(finalPath)}`);
              fs.renameSync(downloadedFile, finalPath);
            } else {
              // Fallback: sanitize the original name (legacy behavior)
              const originalName = path.basename(downloadedFile);
              const sanitized = sanitizeFilename(originalName);
              if (sanitized !== originalName) {
                const sanitizedPath = path.join(effectiveOutputFolder, sanitized);
                if (!fs.existsSync(sanitizedPath)) {
                  fs.renameSync(downloadedFile, sanitizedPath);
                  finalPath = sanitizedPath;
                }
              }
            }

            const stats = fs.statSync(finalPath);


            if (jobId) {
              completeDownload(jobId, stats.size, {
                filePath: finalPath,
                fileName: path.basename(finalPath),
                fileSize: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`
              });
            }

            resolve({
              success: true,
              filePath: finalPath,
              fileName: path.basename(finalPath),
              fileSize: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`
            });
          } else {
            // No complete file found - this might mean download was interrupted
            if (jobId) failDownload(jobId, 'No complete file found (only .part files exist)');
            reject(new Error('No file downloaded'));
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          if (jobId) failDownload(jobId, msg);
          reject(err);
        }
      } else {
        const msg = 'Process exited with code ' + code;
        if (jobId) {
          // Check if it was manually cancelled/paused
          const progress = getDownloadProgress(jobId);
          if (progress && (progress.status === 'paused' || progress.status === 'canceled')) {
            reject(new Error(progress.status === 'paused' ? 'Download paused' : 'Download canceled'));
            return;
          }
        }

        const msg2 = `Download interrupted (code ${code})`;
        reject(new Error(msg2));
      }
    });

    pythonProcess.on('error', (err) => {
      console.error('Spawn error:', err);
      if (jobId) failDownload(jobId, err.message);
      reject(err);
    });
  });
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
