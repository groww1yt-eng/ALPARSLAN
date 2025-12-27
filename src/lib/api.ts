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
    const text = await response.text();
    throw new Error(text || "Failed to fetch metadata");
  }

  return response.json();
}

// ================= DOWNLOAD =================
export async function downloadVideo(
  url: string,
  videoId: string,
  jobId: string,
  outputFolder: string,
  mode: "video" | "audio",
  quality?: string,
  format?: string
): Promise<{ success: boolean; filePath: string; fileName: string; fileSize: string }> {
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
      format
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to download video");
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
