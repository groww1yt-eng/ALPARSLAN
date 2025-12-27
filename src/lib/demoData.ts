import type { VideoMetadata, PlaylistVideo, HistoryItem, VideoQuality, AudioFormat, DownloadMode } from '@/types';

// Deterministic hash function to generate consistent data from URL
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Seeded random number generator for consistency
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

const playlistThumbnails = [
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=480&h=270&fit=crop',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=480&h=270&fit=crop',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=480&h=270&fit=crop',
];

const videoThumbnails = [
  'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=480&h=270&fit=crop',
  'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=480&h=270&fit=crop',
  'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=480&h=270&fit=crop',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=480&h=270&fit=crop',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=480&h=270&fit=crop',
];

const playlistTitles = [
  'Complete Web Development Bootcamp 2024',
  'Master JavaScript - Full Course',
  'React & TypeScript Tutorial Series',
  'Python for Data Science Playlist',
  'DevOps & Cloud Computing Essentials',
  'UI/UX Design Fundamentals',
  'Mobile App Development with Flutter',
  'Machine Learning A-Z',
];

const videoTitles = [
  'Introduction to Modern JavaScript ES6+',
  'Building REST APIs with Node.js',
  'React Hooks Deep Dive Tutorial',
  'CSS Grid Layout Complete Guide',
  'TypeScript for Beginners',
  'Understanding Async/Await',
  'Docker Container Basics',
  'Git & GitHub Workflow',
  'Responsive Web Design Tips',
  'Database Design Fundamentals',
  'Authentication Best Practices',
  'Testing Your Applications',
  'Performance Optimization Techniques',
  'State Management with Redux',
  'GraphQL API Tutorial',
  'Serverless Architecture Overview',
  'CI/CD Pipeline Setup',
  'Web Security Essentials',
  'PWA Development Guide',
  'WebSocket Real-time Apps',
];

const channelNames = [
  'TechWithTim',
  'Fireship',
  'Traversy Media',
  'The Coding Train',
  'Web Dev Simplified',
  'Programming with Mosh',
  'Academind',
  'The Net Ninja',
];

export function generateMockMetadata(url: string): VideoMetadata | null {
  if (!isValidYouTubeUrl(url)) return null;

  const seed = hashCode(url);
  const random = seededRandom(seed);

  const isPlaylist = url.includes('list=') || url.includes('playlist');
  const videoId = extractVideoId(url) || `vid_${seed.toString(36).slice(0, 11)}`;
  const channelIndex = Math.floor(random() * channelNames.length);
  const channel = channelNames[channelIndex];

  if (isPlaylist) {
    // Consistent video count based on URL (between 8 and 25)
    const videoCount = 8 + Math.floor(random() * 18);
    const playlistTitleIndex = Math.floor(random() * playlistTitles.length);
    const playlistThumbnailIndex = Math.floor(random() * playlistThumbnails.length);

    // Generate playlist videos with realistic titles - NOT pre-selected
    const videos: PlaylistVideo[] = Array.from({ length: videoCount }, (_, i) => {
      const titleIndex = (Math.floor(random() * videoTitles.length) + i) % videoTitles.length;
      const durationSeconds = 180 + Math.floor(random() * 1200); // 3-23 minutes
      return {
        id: `${videoId}_${i + 1}`,
        index: i + 1,
        title: videoTitles[titleIndex],
        duration: formatDuration(durationSeconds),
        thumbnail: videoThumbnails[i % videoThumbnails.length],
        selected: false, // NOT pre-selected
      };
    });

    return {
      id: videoId,
      title: playlistTitles[playlistTitleIndex],
      channel,
      thumbnail: playlistThumbnails[playlistThumbnailIndex],
      duration: `${videoCount} videos`,
      durationSeconds: 0,
      isPlaylist: true,
      playlistTitle: playlistTitles[playlistTitleIndex],
      videoCount,
      videos,
    };
  }

  // Single video
  const titleIndex = Math.floor(random() * videoTitles.length);
  const thumbnailIndex = Math.floor(random() * videoThumbnails.length);
  const durationSeconds = 120 + Math.floor(random() * 1680); // 2-30 minutes

  return {
    id: videoId,
    title: videoTitles[titleIndex],
    channel,
    thumbnail: videoThumbnails[thumbnailIndex],
    duration: formatDuration(durationSeconds),
    durationSeconds,
    isPlaylist: false,
  };
}

export function isValidYouTubeUrl(url: string): boolean {
  const patterns = [
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^(https?:\/\/)?youtu\.be\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/playlist\?list=[\w-]+/,
  ];
  return patterns.some(pattern => pattern.test(url));
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/,
    /youtube\.com\/embed\/([\w-]+)/,
    /[?&]list=([\w-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Calculate realistic file size based on mode, quality, and duration
export function calculateFileSize(
  durationSeconds: number,
  mode: DownloadMode,
  quality?: VideoQuality,
  format?: AudioFormat
): number {
  // Bitrates in kbps (approximate)
  const videoBitrates: Record<VideoQuality, number> = {
    '360p': 700,
    '480p': 1500,
    '720p': 3000,
    '1080p': 5000,
    '1440p': 10000,
    '2160p': 20000,
    'highest': 25000,
  };

  const audioBitrates: Record<AudioFormat, number> = {
    'mp3': 192,
    'm4a': 256,
    'wav': 1411,
    'opus': 160,
  };

  if (mode === 'video') {
    const videoBitrate = videoBitrates[quality || '1080p'];
    const audioBitrate = 192; // Audio track included
    const totalBitrate = videoBitrate + audioBitrate;
    return Math.round((totalBitrate * durationSeconds) / 8 / 1024); // MB
  } else {
    const audioBitrate = audioBitrates[format || 'mp3'];
    return Math.round((audioBitrate * durationSeconds) / 8 / 1024); // MB
  }
}

export function formatFileSize(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
}

export function generateInitialHistory(): HistoryItem[] {
  return [
    {
      id: crypto.randomUUID(),
      title: 'Learn React in 2024 - Full Course',
      channel: 'Fireship',
      thumbnail: videoThumbnails[0],
      mode: 'video',
      quality: '1080p',
      fileSize: '856 MB',
      filePath: '/storage/emulated/0/ALP/Learn React in 2024.mp4',
      completedAt: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: crypto.randomUUID(),
      title: 'Chill Coding Music - 3 Hour Mix',
      channel: 'The Coding Train',
      thumbnail: videoThumbnails[1],
      mode: 'audio',
      format: 'mp3',
      fileSize: '245 MB',
      filePath: '/storage/emulated/0/ALP/Chill Coding Music.mp3',
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id: crypto.randomUUID(),
      title: 'TypeScript Tutorial for Beginners',
      channel: 'Traversy Media',
      thumbnail: videoThumbnails[2],
      mode: 'video',
      quality: '720p',
      fileSize: '428 MB',
      filePath: '/storage/emulated/0/ALP/TypeScript Tutorial.mp4',
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
  ];
}
