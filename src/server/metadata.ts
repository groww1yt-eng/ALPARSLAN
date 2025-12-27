import { execSync } from 'child_process';
import type { VideoMetadata, PlaylistVideo } from '../types/index.js';

function isValidYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\//;
  return youtubeRegex.test(url);
}

export async function getVideoMetadata(url: string): Promise<VideoMetadata | null> {
  if (!isValidYouTubeUrl(url)) {
    throw new Error('Invalid YouTube URL');
  }

  try {
    // Use python -m yt_dlp to ensure yt-dlp is found (better cross-platform support)
    // For playlists, use --flat-playlist to get cleaner output
    const isPlaylistUrl = url.includes('list=') || url.includes('playlist');
    const flatFlag = isPlaylistUrl ? '--flat-playlist' : '';
    // Try to find python executable in common locations
    let pythonCmd = 'python';
    try {
      // Try using the virtual environment python first
      execSync('C:/Users/ariya/Downloads/ALPARSLAN/.venv/Scripts/python.exe -m yt_dlp --version', { encoding: 'utf-8' });
      pythonCmd = 'C:/Users/ariya/Downloads/ALPARSLAN/.venv/Scripts/python.exe';
    } catch {
      // Fallback to system python
      try {
        execSync('python -m yt_dlp --version', { encoding: 'utf-8' });
      } catch {
        throw new Error('yt-dlp is not installed. Please run: pip install yt-dlp');
      }
    }
    const command = `"${pythonCmd}" -m yt_dlp -j --no-warnings ${flatFlag} "${url.replace(/"/g, '\\"')}"`;
    const output = execSync(command, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
    
    // For playlists, yt-dlp outputs NDJSON (newline-delimited JSON)
    // Parse each line separately
    const lines = output.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('No data returned from yt-dlp');
    }
    
    const firstInfo = JSON.parse(lines[0]);
    
    // Check if it's a playlist
    const isPlaylist = firstInfo._type === 'playlist' || firstInfo.extractor?.includes('playlist') || lines.length > 1;

    if (isPlaylist) {
      // Parse all lines for playlist entries
      const allEntries = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);
      
      return parsePlaylistMetadata(firstInfo, allEntries);
    } else {
      return parseVideoMetadata(firstInfo);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch metadata';
    throw new Error(`Failed to fetch YouTube metadata: ${message}`);
  }
}

function parseVideoMetadata(info: any): VideoMetadata {
  const duration = info.duration || 0;
  const durationMinutes = Math.floor(duration / 60);
  const durationSeconds = duration % 60;
  const durationString = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;

  return {
    id: info.id,
    title: info.title || 'Unknown Video',
    channel: info.uploader || info.channel || 'Unknown Channel',
    thumbnail: info.thumbnail || info.thumbnails?.[0]?.url || '',
    duration: durationString,
    durationSeconds: duration,
    isPlaylist: false,
  };
}

function parsePlaylistMetadata(info: any, entries: any[] = []): VideoMetadata {
  // If entries passed separately, use them; otherwise use info.entries
  const videoEntries = entries.length > 0 ? entries : (info.entries || []);
  
  // Filter out the playlist info entry and get only video entries
  const videos: PlaylistVideo[] = videoEntries
    .filter((entry: any) => entry.id && entry.title) // Ensure it's a valid video entry
    .map((entry: any, index: number) => {
      const duration = entry.duration || 0;
      const durationMinutes = Math.floor(duration / 60);
      const durationSeconds = duration % 60;
      const durationString = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;

      return {
        id: entry.id,
        index: index + 1,
        title: entry.title || 'Unknown Video',
        duration: durationString,
        thumbnail: entry.thumbnail || entry.thumbnails?.[0]?.url || '',
        selected: false,
      };
    });

  return {
    id: info.id || 'playlist',
    title: info.title || 'Unknown Playlist',
    channel: info.uploader || info.channel || 'Unknown Channel',
    thumbnail: info.thumbnail || info.thumbnails?.[0]?.url || '',
    duration: `${videos.length} videos`,
    durationSeconds: 0,
    isPlaylist: true,
    playlistTitle: info.title || 'Unknown Playlist',
    videoCount: videos.length,
    videos: videos,
  };
}
