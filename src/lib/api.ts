import type { VideoMetadata } from '@/types';
import { makeApiCall } from './apiClient';

// ================= METADATA =================

// Fetch video metadata from the backend
export async function fetchMetadata(url: string): Promise<VideoMetadata> {
  const response = await makeApiCall('/api/metadata', {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch metadata";
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      const text = await response.text();
      errorMessage = text || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// ================= DOWNLOAD =================

// Metadata used for resolving filenames on the backend
export interface NamingMetadata {
  title: string;
  channel: string;
  index?: number;
  contentType: 'single' | 'playlist';
}

// Initiate a download job
export async function downloadVideo(
  url: string,
  videoId: string,
  jobId: string,
  outputFolder: string,
  mode: "video" | "audio",
  quality?: string,
  format?: string,
  namingMetadata?: NamingMetadata,
  subtitleOptions?: {
    downloadSubtitles: boolean;
    subtitleLanguage: 'auto' | 'en';
    createPerChannelFolder?: boolean;
  }
): Promise<{ success: boolean; filePath: string; fileName: string; fileSize: string; status?: string }> {
  const response = await makeApiCall('/api/download', {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url,
      videoId,
      jobId,
      outputFolder,
      mode,
      quality,
      format,
      // Naming metadata for backend filename resolution
      title: namingMetadata?.title,
      channel: namingMetadata?.channel,
      index: namingMetadata?.index,
      contentType: namingMetadata?.contentType,
      downloadSubtitles: subtitleOptions?.downloadSubtitles,
      subtitleLanguage: subtitleOptions?.subtitleLanguage,
      createPerChannelFolder: subtitleOptions?.createPerChannelFolder,
    })
  });

  if (!response.ok) {
    let errorMessage = "Failed to download video";
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      const text = await response.text();
      errorMessage = text || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// ================= FILE SIZE ESTIMATION =================

// Estimate file size before downloading (useful for playlists)
export async function getEstimatedFileSize(
  url: string,
  mode: "video" | "audio",
  quality?: string,
  format?: string,
  playlistItems?: string,
  signal?: AbortSignal
): Promise<{ fileSize: number }> {
  try {
    const response = await makeApiCall('/api/filesize', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url, mode, quality, format, playlistItems }),
      signal
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.warn("Estimation failed:", errorData.error);
      } catch { }
      return { fileSize: 0 };
    }

    return response.json();
  } catch (err) {
    console.warn("Estimation failed:", err);
    return { fileSize: 0 };
  }
}

// ================= PROGRESS =================

export interface DownloadProgressData {
  totalBytes: number;
  downloadedBytes: number;
  percentage: number;
  speed: number; // bytes per second
  eta: number; // seconds remaining
  status: 'downloading' | 'paused' | 'completed' | 'failed' | 'canceled';
  error?: string;
  result?: {
    filePath: string;
    fileName: string;
    fileSize: string;
  };
}

// Get progress for a specific job
export async function getDownloadProgress(jobId: string): Promise<DownloadProgressData> {
  const response = await makeApiCall(`/api/download/progress/${jobId}`);
  if (!response.ok) {
    throw new Error("Failed to get download progress");
  }
  return response.json();
}

// Pause a running download
export async function pauseDownload(jobId: string): Promise<{ success: boolean }> {
  const response = await makeApiCall(`/api/download/pause/${jobId}`, {
    method: "POST"
  });
  if (!response.ok) {
    throw new Error("Failed to pause download");
  }
  return response.json();
}

// Resume a paused download
export async function resumeDownload(jobId: string): Promise<{ success: boolean }> {
  const response = await makeApiCall(`/api/download/resume/${jobId}`, {
    method: "POST"
  });
  if (!response.ok) {
    throw new Error("Failed to resume download");
  }
  return response.json();
}

// Cancel a download
export async function cancelDownload(jobId: string): Promise<{ success: boolean }> {
  const response = await makeApiCall(`/api/download/cancel/${jobId}`, {
    method: "POST"
  });
  if (!response.ok) {
    throw new Error("Failed to cancel download");
  }
  return response.json();
}

// Fetch all active downloads (for sync/persistence)
export async function fetchActiveDownloads(): Promise<{ downloads: Record<string, DownloadProgressData> }> {
  const response = await makeApiCall('/api/downloads/active');
  if (!response.ok) {
    throw new Error("Failed to fetch active downloads");
  }
  return response.json();
}

