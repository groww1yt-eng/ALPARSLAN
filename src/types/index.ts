export type DownloadMode = 'video' | 'audio';
export type VideoQuality = '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p' | 'highest';
export type AudioFormat = 'mp3' | 'm4a' | 'wav' | 'opus';
export type PlaylistMode = 'all' | 'range' | 'manual';
export type JobStatus = 'queued' | 'downloading' | 'paused' | 'waiting' | 'completed' | 'failed' | 'canceled';
export type ContentType = 'single' | 'playlist';
export type NamingTag = '<title>' | '<index>' | '<quality>' | '<channel>' | '<date>' | '<format>';

export interface NamingValidationError {
  type: 'empty' | 'missing_mandatory' | 'invalid_tag' | 'invalid_character' | 'invalid_quality' | 'invalid_index';
  message: string;
}

export interface NamingTemplates {
  single: {
    video: string;
    audio: string;
  };
  playlist: {
    video: string;
    audio: string;
  };
}

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

export interface PlaylistVideo {
  id: string;
  index: number;
  title: string;
  duration: string;
  thumbnail: string;
  selected: boolean;
}

export interface DownloadJob {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  mode: DownloadMode;
  quality?: VideoQuality;
  format?: AudioFormat;
  status: JobStatus;
  progress: number;
  speed?: string;
  eta?: string;
  fileSize?: string;
  downloadedSize?: string;
  filePath?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

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

export interface AppSettings {
  outputFolder: string;
  defaultMode: DownloadMode;
  defaultQuality: VideoQuality;
  defaultFormat: AudioFormat;
  downloadSubtitles: boolean;
  subtitleLanguage: 'auto' | 'en';
  reEncode: boolean;
  reEncodeFormat: string;
  filenameTemplate: string;
  perChannelFolders: boolean;
  minimalConsole: boolean;
  namingTemplates: NamingTemplates;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}
