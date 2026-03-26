import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { VideoMetadata, PlaylistVideo } from '../types/index.js';

// Regex to validate typical YouTube URLs
function isValidYouTubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\//;
  return youtubeRegex.test(url);
}

// Fetch metadata for a given YouTube URL (video or playlist)
export async function getVideoMetadata(url: string): Promise<VideoMetadata | null> {
  if (!isValidYouTubeUrl(url)) {
    throw new Error('Invalid YouTube URL');
  }

  try {
    // Use python -m yt_dlp to ensure yt-dlp is found (better cross-platform support)
    const isPlaylistUrl = url.includes('list=') || url.includes('playlist');
    // For playlists, use --flat-playlist to get cleaner, faster output without full video details
    const flatFlag = isPlaylistUrl ? '--flat-playlist' : '';

    // Attempt to locate python executable (custom venv or system)
    let pythonCmd = 'python';
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      try {
        // Try using the virtual environment python first (specific to this project structure)
        const venvPath = path.resolve(process.cwd(), '.venv/Scripts/python.exe');
        if (fs.existsSync(venvPath)) {
          pythonCmd = venvPath;
        }
      } catch {
        // Fallback to system python
      }
    }

    // Check for cookies file to authenticate if present
    const cookiePath = path.resolve(process.cwd(), 'cookies.txt');
    const cookieExists = fs.existsSync(cookiePath);
    
    // Debug logging for production troubleshooting
    if (cookieExists) {
      const stats = fs.statSync(cookiePath);
      console.log(`[DEBUG] Found cookies.txt at ${cookiePath} (${stats.size} bytes)`);
      try {
        const firstLine = fs.readFileSync(cookiePath, 'utf8').split('\n')[0];
        console.log(`[DEBUG] Cookie file header: ${firstLine.substring(0, 30)}...`);
      } catch (err) {
        console.error('[DEBUG] Failed to read cookie file for verification:', err);
      }
    } else {
      console.warn(`[DEBUG] cookies.txt NOT FOUND at ${cookiePath}`);
    }

    const ytdlpArgs: string[] = ['-j', '--no-warnings'];
    if (isPlaylistUrl) ytdlpArgs.push('--flat-playlist');
    if (cookieExists) ytdlpArgs.push('--cookies', cookiePath);

    // Core network resilience flags
    ytdlpArgs.push('--force-ipv4');
    ytdlpArgs.push('--no-check-certificate');
    ytdlpArgs.push('--geo-bypass');

    // Basic User-Agent spoofing to avoid default python-requests blocking
    ytdlpArgs.push('--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    
    ytdlpArgs.push(url);

    console.log(`[DEBUG] Executing yt-dlp to fetch metadata for ${url}`);
    
    // Execute yt-dlp command synchronously using spawnSync to avoid shell quoting issues
    const result = spawnSync(pythonCmd, ['-m', 'yt_dlp', ...ytdlpArgs], { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });

    if (result.error) {
      throw result.error;
    }

    let output = result.stdout || '';

    // If there's an error code and no standard output was produced, throw the stderr
    if (result.status !== 0 && !output.trim()) {
      throw new Error(`yt-dlp exited with code ${result.status}: ${result.stderr || 'No error output'}`);
    }

    // For playlists, yt-dlp outputs NDJSON (newline-delimited JSON), so we split logic
    const lines = output.trim().split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      throw new Error('No data returned from yt-dlp');
    }

    const firstInfo = JSON.parse(lines[0]);

    // Determine if it's a playlist based on type or extraction result
    const isPlaylist = firstInfo._type === 'playlist' || firstInfo.extractor?.includes('playlist') || lines.length > 1;

    if (isPlaylist) {
      // Parse all lines if it's a playlist
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

// Convert yt-dlp JSON output to internal VideoMetadata format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// Convert yt-dlp playlist JSON output to internal VideoMetadata format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePlaylistMetadata(info: any, entries: any[] = []): VideoMetadata {
  // If entries passed separately (from NDJSON lines), use them; otherwise use info.entries if bundled
  const videoEntries = entries.length > 0 ? entries : (info.entries || []);

  // Filter out the playlist metadata entry itself and process valid video entries
  const videos: PlaylistVideo[] = videoEntries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((entry: any) => entry.id && entry.title) // Ensure it's a valid video entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
