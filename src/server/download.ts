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
  setStage,
  setStatus
} from './downloadManager.js';

// Interface for the final result of a download operation
export interface DownloadResult {
  success: boolean;
  filePath: string;
  fileName: string;
  fileSize: string; // in MB
}

// Configuration options for a download job
export interface DownloadOptions {
  url: string;
  videoId: string;
  jobId?: string; // Unique ID for tracking
  outputFolder: string;
  mode: 'video' | 'audio';
  quality?: string; // e.g., '1080p', 'highest'
  format?: string;  // e.g., 'mp3', 'mp4'
  fileSize?: number; // Estimated total size
  resolvedFilename?: string; // Final filename without extension (from naming resolver)
  onProgress?: (progress: number) => void; // Optional callback
  downloadSubtitles?: boolean;
  subtitleLanguage?: 'auto' | 'en';
  createPerChannelFolder?: boolean;
  channel?: string;
}

// Helper: Get total file size using yt-dlp simulation
// This runs yt-dlp with --skip-download and -j (JSON) to get metadata
export async function getFileSize(url: string, mode: 'video' | 'audio', quality: string = '1080p', playlistItems?: string): Promise<number> {
  try {
    let ytdlpArgs: string[] = ['-j'];

    if (playlistItems) {
      ytdlpArgs.push('--playlist-items', playlistItems);
    }

    if (mode === 'audio') {
      // Audio extraction mode
      ytdlpArgs.push('-x');
      ytdlpArgs.push('--audio-format=mp3');
    } else {
      // Video mode: Select formats based on quality preference
      // Format strings mimic yt-dlp syntax for best video+audio combination
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
      // Add remux in size calculation too to match actual download process behavior
      ytdlpArgs.push('--remux-video=mp4');
    }

    ytdlpArgs.push('--skip-download'); // Do not actually download
    ytdlpArgs.push('--ignore-errors'); // Don't fail entire batch if one is private
    ytdlpArgs.push('--no-warnings');   // Reduce console noise
    ytdlpArgs.push(url);

    // Check for cookies file to support age-restricted content
    const cookiePath = 'cookies.txt';
    if (fs.existsSync(cookiePath)) {
      ytdlpArgs.push('--cookies', cookiePath);
    }

    // execute synchronously
    const command = `python -m yt_dlp ${ytdlpArgs.map(arg => `"${arg}"`).join(' ')}`;

    let output = '';
    try {
      // Increase maxBuffer to handle large JSON outputs for playlists
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
      // Split by newline and parse each line (for playlists which output NDJSON)
      const lines = output.trim().split('\n');
      let total = 0;

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const info = JSON.parse(line);
          // Sum up filesize (exact) or filesize_approx (estimate)
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

// Sanitize filename - replace illegal filesystem characters
export function sanitizeFilename(filename: string): string {
  // Map commonly illegal characters to safe replacements
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

  // Remove trailing dots and spaces which can cause issues on Windows
  sanitized = sanitized.replace(/[\s.]+$/, '');

  return sanitized;
}

// Handle duplicate filenames - Append (N) if file already exists
function getUniqueFilename(filePath: string): string {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const basename = path.basename(filePath, ext);

  // If file doesn't exist, return as is (no duplicate)
  if (!fs.existsSync(filePath)) {
    return filePath;
  }

  // File exists, so start appending numbers (2), (3)...
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

// Main download function - spawns yt-dlp process
export async function downloadVideo(options: DownloadOptions): Promise<DownloadResult> {
  const { url, videoId, jobId, outputFolder, mode, quality = '1080p', format = 'mp3', fileSize = 0, resolvedFilename, downloadSubtitles, subtitleLanguage, createPerChannelFolder, channel } = options;

  // Handle per-channel subdirectory logic
  let effectiveOutputFolder = outputFolder;
  if (createPerChannelFolder && channel) {
    const sanitizedChannel = sanitizeFilename(channel);
    effectiveOutputFolder = path.join(outputFolder, sanitizedChannel);
  }

  // Ensure output folder exists
  if (!fs.existsSync(effectiveOutputFolder)) {
    fs.mkdirSync(effectiveOutputFolder, { recursive: true });
  }

  // Register with manager immediately to track state
  if (jobId) {
    registerDownload(jobId, options);
  }

  return new Promise((resolve, reject) => {
    let ytdlpArgs: string[] = [];

    if (mode === 'audio') {
      ytdlpArgs.push('-x'); // Extract audio
      ytdlpArgs.push(`--audio-format=${format}`);
      ytdlpArgs.push('--audio-quality=0'); // Best quality (VBR)
    } else {
      // Video download configuration
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
      ytdlpArgs.push('--remux-video=mp4'); // Ensure output container is MP4
    }

    // Subtitles configuration
    if (mode === 'video' && downloadSubtitles) {
      ytdlpArgs.push('--embed-subs'); // Embed subs in video file

      if (subtitleLanguage === 'en') {
        ytdlpArgs.push('--sub-langs', 'en.*'); // Only English
      }
      // if 'auto', we leave it to default (all available)
    }

    // Use temp filename during download, will rename to resolved filename after completion
    // This ensures we don't have partial files with final names if interrupted
    const tempBasename = jobId ? `${jobId}.temp` : `${crypto.randomUUID()}.temp`;
    const outputTemplate = path.join(effectiveOutputFolder, `${tempBasename}.%(ext)s`);
    ytdlpArgs.push('-o', outputTemplate);
    ytdlpArgs.push('--no-warnings');
    ytdlpArgs.push('--newline'); // Important: Output progress on new lines for parsing

    // URL to download
    ytdlpArgs.push(url);

    // Cookies support
    const cookiePath = 'cookies.txt';
    if (fs.existsSync(cookiePath)) {
      ytdlpArgs.push('--cookies', cookiePath);
    }

    console.log(`Starting download (spawn): ${url}`);
    console.log(`Mode: ${mode}, Quality: ${quality}, Format: ${format}`);

    // Spawn process (async execution)
    const pythonProcess = spawn('python', ['-m', 'yt_dlp', ...ytdlpArgs]);

    if (jobId) {
      // Store process reference in manager for Pause/Cancel capabilities
      setDownloadProcess(jobId, pythonProcess);
    }

    let stdoutBuffer = '';
    let stderrBuffer = '';

    // Function to parse stdout lines and update progress
    const processOutput = (data: string, isError: boolean) => {
      // Improved logic: Replace \r with \n then split by \n to handle all line endings
      // This ensures we catch progress updates that might use \r carriage returns
      const normalizedData = data.replace(/\r/g, '\n');
      const lines = normalizedData.split('\n');

      // The last element is either an empty string (if data ended with \n)
      // or a partial line that needs to be buffered until next chunk
      const completeLines = lines.slice(0, -1);
      const remaining = lines[lines.length - 1];

      for (const line of completeLines) {
        if (!line.trim()) continue;

        if (!isError) {
          console.log(`[yt-dlp ${jobId}] ${line.trim()}`);
        } else {
          console.log(`[yt-dlp stderr ${jobId}] ${line.trim()}`);
        }

        if (jobId) {
          // Detect stage changes (Video -> Audio -> Merging)
          if (line.includes('[download]') && line.includes('Destination:')) {
            if (line.includes('.mp4') && !line.includes('.m4a')) {
              setStage(jobId, 'video');
            } else if (line.includes('.m4a') || line.includes('.mp3') || line.includes('.opus')) {
              setStage(jobId, 'audio');
            }
          }

          // Detect merge stage (ffmpeg)
          if (line.includes('[Merger]')) {
            setStage(jobId, 'merging');
            setStatus(jobId, 'converting');
          }

          // Detect conversion/post-processing stage (ffmpeg, metadata, subs)
          if (
            line.includes('[ExtractAudio]') ||
            line.includes('[FixupM4a]') ||
            line.includes('[ffmpeg]') ||
            line.includes('[Metadata]') ||
            line.includes('[EmbedSubtitle]') ||
            line.includes('[Thumbnails]') ||
            line.includes('Deleting original file')
          ) {
            setStatus(jobId, 'converting');
          }

          // Parse progress percentage and size
          if (line.includes('[download]') && line.includes('%')) {
            const percentMatch = line.match(/(\d+\.?\d*)%/);
            const sizeMatch = line.match(/of\s+~?(\d+\.?\d*)([KMGTP]?i?B)/i);

            if (sizeMatch && percentMatch) {
              const totalStr = sizeMatch[1];
              const unit = sizeMatch[2];
              let totalBytes = parseFloat(totalStr);

              // Convert units to bytes
              if (unit.includes('Ki') || unit.includes('KiB')) totalBytes *= 1024;
              else if (unit.includes('Mi') || unit.includes('MiB')) totalBytes *= 1024 ** 2;
              else if (unit.includes('Gi') || unit.includes('GiB')) totalBytes *= 1024 ** 3;

              // Update total bytes for current stage
              setStageTotalBytes(jobId, totalBytes);

              const percentage = parseFloat(percentMatch[1]);
              const downloadedBytes = (totalBytes * percentage) / 100;

              // Update global store
              updateProgress(jobId, downloadedBytes);

              // Force 'converting' status when download hits ~100% in audio mode
              if (percentage >= 99.0 && mode === 'audio') {
                setStatus(jobId, 'converting');
              }
            }
          }

          // Fallback: If line explicitly says "100%", force converting for audio
          if (mode === 'audio' && line.includes('100%') && line.includes('[download]')) {
            setStatus(jobId, 'converting');
          }
        }
      }

      return remaining;
    };

    // Attach stdout text handler
    pythonProcess.stdout.on('data', (data) => {
      stdoutBuffer += data.toString();
      stdoutBuffer = processOutput(stdoutBuffer, false);
    });

    // Attach stderr handler (for logs)
    pythonProcess.stderr.on('data', (data) => {
      // Some yt-dlp warnings/errors might be relevant, but usually we just log them
      console.error(`[yt-dlp error raw] ${data}`);
    });

    // Process close handler
    pythonProcess.on('close', (code) => {
      // CRITICAL: Check pause/cancel status FIRST before any other processing
      // This must happen before checking exit code because SIGKILL can cause code=0 or code=null
      if (jobId) {
        const progress = getDownloadProgress(jobId);
        if (progress && (progress.status === 'paused' || progress.status === 'canceled')) {
          console.log(`Download ${jobId} was ${progress.status}, not completing.`);
          reject(new Error(progress.status === 'paused' ? 'Download paused' : 'Download canceled'));
          return;
        }
      }

      if (code === 0) {
        // Success execution
        console.log('✅ Download process completed');

        // Logic to Find and Rename the downloaded temp file
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

          // Fallback: find most recently modified file (legacy safety)
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

            // Rename logic
            if (resolvedFilename) {
              const targetName = `${resolvedFilename}${downloadedExt}`;
              const targetPath = path.join(effectiveOutputFolder, targetName);
              // Use getUniqueFilename to handle if target already exists
              finalPath = getUniqueFilename(targetPath);

              console.log(`Renaming: ${path.basename(downloadedFile)} -> ${path.basename(finalPath)}`);
              fs.renameSync(downloadedFile, finalPath);
            } else {
              // Fallback: sanitize original if no resolved name provided
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
            // No complete file found - this might mean download was interrupted technically
            if (jobId) failDownload(jobId, 'No complete file found (only .part files exist)');
            reject(new Error('No file downloaded'));
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          if (jobId) failDownload(jobId, msg);
          reject(err);
        }
      } else {
        // Non-zero exit code
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

// Utility to list downloaded files in output folder to check results
export function getDownloadedFiles(outputFolder: string, videoTitle: string): string[] {
  try {
    if (!fs.existsSync(outputFolder)) {
      return [];
    }

    const files = fs.readdirSync(outputFolder);
    return files.filter(file => {
      const filePath = path.join(outputFolder, file);
      return fs.statSync(filePath).isFile();
    });
  } catch (error) {
    console.error('Error reading output folder:', error);
    return [];
  }
}
