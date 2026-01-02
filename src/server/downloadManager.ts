import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

import type { DownloadOptions } from './download.js';

export interface DownloadProgress {
  totalBytes: number;
  downloadedBytes: number;
  percentage: number;
  speed: number; // bytes per second
  eta: number; // seconds remaining
  status: 'downloading' | 'paused' | 'completed' | 'failed' | 'canceled';
  error?: string;
  // Multi-stage tracking
  stage: 'video' | 'audio' | 'merging' | 'complete';
  videoTotalBytes: number;    // Total bytes for video stage
  audioTotalBytes: number;    // Total bytes for audio stage
  videoDownloadedBytes: number; // Downloaded in video stage
  audioDownloadedBytes: number; // Downloaded in audio stage
}

export interface ActiveDownload {
  videoId: string;
  process: ChildProcess | null;
  isPaused: boolean;
  progress: DownloadProgress;
  startTime: number;
  downloadedBytesAtLastCheck: number;
  lastCheckTime: number;
  filePath: string;
  options: DownloadOptions;
  isResuming: boolean; // Flag to prevent re-registration on resume
  result?: {
    filePath: string;
    fileName: string;
    fileSize: string;
  };
}

const activeDownloads = new Map<string, ActiveDownload>();

export function getActiveDownloads(): Record<string, DownloadProgress> {
  const downloads: Record<string, DownloadProgress> = {};
  for (const [id, download] of activeDownloads.entries()) {
    downloads[id] = getDownloadProgress(id)!;
  }
  return downloads;
}

export function getDownloadResult(jobId: string) {
  const download = activeDownloads.get(jobId);
  return download?.result || null;
}

export function getDownloadProgress(jobId: string): DownloadProgress | null {
  const download = activeDownloads.get(jobId);
  if (!download) return null;
  // ... (rest of function is fine, but I need to make sure I don't delete it.
  // Wait, I am using replace_file_content, so I should be careful.
  // The instruction implies adding functions.
  // I'll stick to adding `result` to interface and the new functions at the end or appropriate places.
  // Actually, let's use `multi_replace` or just be careful with `replace_file_content` ranges.
  // `ActiveDownload` is at the top. `activeDownloads` is below it.
  // I will split this into two edits if needed, or one big one if they are close.
  // They are close enough.


  // Update speed and ETA
  const now = Date.now();
  const timeDiff = (now - download.lastCheckTime) / 1000; // seconds

  if (timeDiff > 0.5) {
    // Update speed calculation
    const bytesDiff = download.progress.downloadedBytes - download.downloadedBytesAtLastCheck;
    const speed = bytesDiff / timeDiff;
    download.progress.speed = Math.max(0, speed);

    // Calculate ETA
    if (speed > 0 && download.progress.totalBytes > 0) {
      const remainingBytes = download.progress.totalBytes - download.progress.downloadedBytes;
      download.progress.eta = remainingBytes / speed;
    }

    download.downloadedBytesAtLastCheck = download.progress.downloadedBytes;
    download.lastCheckTime = now;
  }

  // Create a copy of progress for response
  const progressCopy: DownloadProgress & { result?: any } = { ...download.progress };

  // Include result if available
  if (download.result) {
    progressCopy.result = download.result;
  }

  // For audio mode, apply format-based size estimation multipliers
  // OPUS is the source format - other formats are converted and may have different sizes
  if (download.options.mode === 'audio' && download.options.format) {
    const format = download.options.format.toLowerCase();
    let multiplier = 1.0;

    switch (format) {
      case 'mp3':
        multiplier = 1.67; // MP3: 1.67x
        break;
      case 'm4a':
        multiplier = 2.67; // M4A (AAC): 2.67x
        break;
      case 'wav':
        multiplier = 12.85; // WAV: 12.85x
        break;
      case 'opus':
      default:
        multiplier = 1.0; // OPUS: 1x (native)
        break;
    }

    // Apply multiplier to total bytes for display
    progressCopy.totalBytes = Math.round(download.progress.totalBytes * multiplier);
    progressCopy.audioTotalBytes = Math.round(download.progress.audioTotalBytes * multiplier);

    // Recalculate percentage based on estimated total
    if (progressCopy.totalBytes > 0) {
      progressCopy.percentage = (download.progress.downloadedBytes / progressCopy.totalBytes) * 100;
    }
  }

  return progressCopy;
}

export function registerDownload(jobId: string, options: DownloadOptions): void {
  // If already registered (resume case), don't reset progress
  if (activeDownloads.has(jobId)) {
    const existingDownload = activeDownloads.get(jobId)!;
    existingDownload.isResuming = true;
    existingDownload.progress.status = 'downloading';
    return;
  }

  const now = Date.now();
  activeDownloads.set(jobId, {
    videoId: options.videoId,
    process: null,
    isPaused: false,
    progress: {
      totalBytes: options.fileSize || 0,
      downloadedBytes: 0,
      percentage: 0,
      speed: 0,
      eta: 0,
      status: 'downloading',
      stage: options.mode === 'video' ? 'video' : 'audio',
      videoTotalBytes: 0,
      audioTotalBytes: 0,
      videoDownloadedBytes: 0,
      audioDownloadedBytes: 0,
    },
    startTime: now,
    downloadedBytesAtLastCheck: 0,
    lastCheckTime: now,
    filePath: path.join(options.outputFolder, 'downloading'),
    options,
    isResuming: false,
  });
}

export function updateProgress(jobId: string, downloadedBytes: number): void {
  const download = activeDownloads.get(jobId);
  if (!download) return;

  const stage = download.progress.stage;

  // Update stage-specific downloaded bytes
  if (stage === 'video') {
    download.progress.videoDownloadedBytes = downloadedBytes;
  } else if (stage === 'audio') {
    download.progress.audioDownloadedBytes = downloadedBytes;
  }

  // Calculate total downloaded = completed stages + current stage progress
  const totalDownloaded = download.progress.videoDownloadedBytes + download.progress.audioDownloadedBytes;
  download.progress.downloadedBytes = totalDownloaded;

  // Calculate combined total bytes
  const combinedTotal = download.progress.videoTotalBytes + download.progress.audioTotalBytes;
  download.progress.totalBytes = combinedTotal > 0 ? combinedTotal : download.progress.totalBytes;

  if (download.progress.totalBytes > 0) {
    download.progress.percentage = (totalDownloaded / download.progress.totalBytes) * 100;
  }
}

// Set total bytes for current stage (called when yt-dlp reports size)
export function setStageTotalBytes(jobId: string, totalBytes: number): void {
  const download = activeDownloads.get(jobId);
  if (!download) return;

  const stage = download.progress.stage;

  if (stage === 'video') {
    download.progress.videoTotalBytes = totalBytes;
  } else if (stage === 'audio') {
    download.progress.audioTotalBytes = totalBytes;
  }

  // Update combined total
  const combinedTotal = download.progress.videoTotalBytes + download.progress.audioTotalBytes;
  download.progress.totalBytes = combinedTotal;
}

// Transition to next stage (called when stage completes)
export function setStage(jobId: string, stage: 'video' | 'audio' | 'merging' | 'complete'): void {
  const download = activeDownloads.get(jobId);
  if (!download) return;

  // When transitioning FROM video TO audio, finalize video bytes
  if (download.progress.stage === 'video' && stage === 'audio') {
    download.progress.videoDownloadedBytes = download.progress.videoTotalBytes;
  }

  download.progress.stage = stage;

  if (stage === 'merging') {
    // During merge, show 100% or close to it
    download.progress.percentage = 99;
  }
}

export function completeDownload(jobId: string, finalBytes?: number, result?: {
  filePath: string;
  fileName: string;
  fileSize: string;
}): void {
  const download = activeDownloads.get(jobId);
  if (!download) return;

  download.progress.status = 'completed';

  // Store result if provided
  if (result) {
    download.result = result;
  }

  // If we have the actual final file size, update totalBytes to match
  // This ensures progress calculation is accurate
  if (finalBytes && finalBytes > 0) {
    download.progress.totalBytes = finalBytes;
    download.progress.downloadedBytes = finalBytes;
  } else {
    download.progress.downloadedBytes = download.progress.totalBytes;
  }

  download.progress.percentage = 100;
  download.progress.eta = 0;
}

export function failDownload(jobId: string, error?: string): void {
  const download = activeDownloads.get(jobId);
  if (!download) return;

  download.progress.status = 'failed';
  if (error) {
    download.progress.error = error;
  }

  if (download.process) {
    download.process.kill();
  }
}

export function pauseDownload(jobId: string): boolean {
  const download = activeDownloads.get(jobId);
  if (!download) return false;

  download.isPaused = true;
  download.progress.status = 'paused';

  // Kill the process to truly stop network usage
  // The state allows us to resume later by restarting
  if (download.process) {
    try {
      download.process.kill('SIGKILL');
      download.process = null;
    } catch (error) {
      console.error('Error killing process for pause:', error);
    }
  }
  return true;
}

export function resumeDownload(jobId: string): DownloadOptions | null {
  const download = activeDownloads.get(jobId);
  if (!download) return null;

  download.isPaused = false;
  download.progress.status = 'downloading';

  return download.options;
}

export function cancelDownload(jobId: string): boolean {
  const download = activeDownloads.get(jobId);
  if (!download) return false;

  download.progress.status = 'canceled';

  if (download.process) {
    try {
      download.process.kill('SIGKILL');
      download.process = null;
    } catch (error) {
      console.error('Error killing process for cancel:', error);
    }
  }

  activeDownloads.delete(jobId);
  return true;
}

export function removeDownload(jobId: string): void {
  activeDownloads.delete(jobId);
}

export function setDownloadProcess(jobId: string, process: ChildProcess): void {
  const download = activeDownloads.get(jobId);
  if (download) {
    download.process = process;
  }
}
