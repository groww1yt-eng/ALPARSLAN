import type { VideoMetadata } from '@/types';

// ================= METADATA =================
export async function fetchMetadata(url: string): Promise<VideoMetadata> {
  const response = await fetch("/api/metadata", {
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
export interface NamingMetadata {
  title: string;
  channel: string;
  index?: number;
  contentType: 'single' | 'playlist';
}

export async function downloadVideo(
  url: string,
  videoId: string,
  jobId: string,
  outputFolder: string,
  mode: "video" | "audio",
  quality?: string,
  format?: string,
  namingMetadata?: NamingMetadata
): Promise<{ success: boolean; filePath: string; fileName: string; fileSize: string; status?: string }> {
  const response = await fetch("/api/download", {
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
export async function getEstimatedFileSize(
  url: string,
  mode: "video" | "audio",
  quality?: string,
  format?: string,
  playlistItems?: string,
  signal?: AbortSignal
): Promise<{ fileSize: number }> {
  const response = await fetch("/api/filesize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url, mode, quality, format, playlistItems }),
    signal
  });

  if (!response.ok) {
    // Attempt to read error for debugging, but estimation failure shouldn't block UI
    try {
      const errorData = await response.json();
      console.warn("Estimation failed:", errorData.error);
    } catch { }

    // Return 0 if we can't get size - download will proceed anyway
    return { fileSize: 0 };
  }

  return response.json();
}

// ================= PROGRESS =================
export interface DownloadProgressData {
  totalBytes: number;
  downloadedBytes: number;
  percentage: number;
  speed: number; // bytes per second
  eta: number; // seconds remaining
  status: 'downloading' | 'paused' | 'completed' | 'failed';
  error?: string;
}

export async function getDownloadProgress(jobId: string): Promise<DownloadProgressData> {
  const response = await fetch(`/api/download/progress/${jobId}`);
  if (!response.ok) {
    throw new Error("Failed to get download progress");
  }
  return response.json();
}

export async function pauseDownload(jobId: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/download/pause/${jobId}`, {
    method: "POST"
  });
  if (!response.ok) {
    throw new Error("Failed to pause download");
  }
  return response.json();
}

export async function resumeDownload(jobId: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/download/resume/${jobId}`, {
    method: "POST"
  });
  if (!response.ok) {
    throw new Error("Failed to resume download");
  }
  return response.json();
}

export async function cancelDownload(jobId: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/download/cancel/${jobId}`, {
    method: "POST"
  });
  if (!response.ok) {
    throw new Error("Failed to cancel download");
  }
  return response.json();
}
