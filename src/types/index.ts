// Basic types for download configuration
export type DownloadMode = 'video' | 'audio';
export type VideoQuality = '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p' | 'highest';
export type AudioFormat = 'mp3' | 'm4a' | 'wav' | 'opus';
export type PlaylistMode = 'all' | 'range' | 'manual';

// Status of a download job
export type JobStatus = 'queued' | 'downloading' | 'converting' | 'paused' | 'waiting' | 'completed' | 'failed' | 'canceled';
export type ContentType = 'single' | 'playlist';

// Available tags for filename templating
export type NamingTag = '<title>' | '<index>' | '<quality>' | '<channel>' | '<date>' | '<format>';

// Validation errors for naming templates
export interface NamingValidationError {
  type: 'empty' | 'missing_mandatory' | 'invalid_tag' | 'invalid_character' | 'invalid_quality' | 'invalid_index';
  message: string;
}

// User settings for naming templates
export interface NamingTemplates {
  single: {
    video: string;
    audio: string;
  };
  playlist: {
    video: string;
    audio: string;
    // Note: Playlist audio usually needs index to keep order
  };
}

// Metadata fetched from YouTube
export interface VideoMetadata {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  durationSeconds: number;
  isPlaylist: boolean;
  playlistTitle?: string;
  videoCount?: number;
  videos?: PlaylistVideo[];
}

// Individual video in a playlist
export interface PlaylistVideo {
  id: string;
  index: number;
  title: string;
  duration: string;
  thumbnail: string;
  selected: boolean;
}

// Active download job
export interface DownloadJob {
  id: string; // UUID
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  mode: DownloadMode;
  quality?: VideoQuality;
  format?: AudioFormat;
  status: JobStatus;
  progress: number;
  speed?: string; // string representation e.g. "2.5 MB/s"
  eta?: string;   // string representation e.g. "00:45"
  fileSize?: string;
  downloadedSize?: string;
  filePath?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Completed download history item
export interface HistoryItem {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  mode: DownloadMode;
  quality?: VideoQuality;
  format?: AudioFormat;
  fileSize: string;
  filePath: string;
  completedAt: Date;
}

// Global Application Settings
export interface AppSettings {
  outputFolder: string;
  defaultMode: DownloadMode;
  defaultQuality: VideoQuality;
  defaultFormat: AudioFormat;
  downloadSubtitles: boolean;
  subtitleLanguage: 'auto' | 'en';
  reEncode: boolean;
  reEncodeFormat: string;
  filenameTemplate: string; // Legacy field for single video template?
  perChannelFolders: boolean;
  minimalConsole: boolean;
  namingTemplates: NamingTemplates;
}

// UI Notification
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}
