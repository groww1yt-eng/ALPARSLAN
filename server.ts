import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getVideoMetadata } from './src/server/metadata.js';
import { downloadVideo, getFileSize } from './src/server/download.js';
import { getDownloadProgress, pauseDownload, resumeDownload } from './src/server/downloadManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files (from dist folder)
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Fetch metadata for a video or playlist
app.post('/api/metadata', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    const metadata = await getVideoMetadata(url);
    res.json(metadata);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching metadata:', message);
    res.status(500).json({ error: message });
  }
});

// Get estimated file size (for Dashboard display)
app.post('/api/filesize', async (req: Request, res: Response) => {
  try {
    const { url, mode, quality, format, playlistItems } = req.body;

    if (!url || !mode) {
      res.status(400).json({ error: 'URL and mode are required' });
      return;
    }

    // Get raw file size from yt-dlp (possibly with range/selection)
    let fileSize = await getFileSize(url, mode, quality, playlistItems);

    // For audio mode, apply format-based multipliers (same as during download)
    if (mode === 'audio' && format) {
      const formatLower = format.toLowerCase();
      let multiplier = 1.0;

      switch (formatLower) {
        case 'mp3':
          multiplier = 1.67;
          break;
        case 'm4a':
          multiplier = 2.67;
          break;
        case 'wav':
          multiplier = 12.85;
          break;
        case 'opus':
        default:
          multiplier = 1.0;
          break;
      }

      fileSize = Math.round(fileSize * multiplier);
    }

    res.json({ fileSize });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error getting file size:', message);
    res.status(500).json({ error: message, fileSize: 0 });
  }
});

// Download a video or audio
app.post('/api/download', async (req: Request, res: Response) => {
  try {
    const { url, videoId, jobId, outputFolder, mode, quality, format } = req.body;

    if (!url || !videoId || !jobId || !outputFolder || !mode) {
      res.status(400).json({ error: 'Missing required parameters: url, videoId, jobId, outputFolder, mode' });
      return;
    }

    // Get file size first (for progress tracking)
    const fileSize = await getFileSize(url, mode, quality);

    // Pass fileSize to downloadVideo
    const result = await downloadVideo({
      url,
      videoId,
      jobId,
      outputFolder,
      mode,
      quality,
      format,
      fileSize,
    });

    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Handle expected interruptions (Pause/Cancel) gracefully
    if (message === 'Download paused' || message === 'Download canceled') {
      res.json({ success: true, status: message.toLowerCase().replace('download ', '') });
      return;
    }

    console.error('Error downloading video:', message);
    res.status(500).json({ error: message });
  }
});

// Get download progress
app.get('/api/download/progress/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const progress = getDownloadProgress(jobId);

  if (!progress) {
    res.status(404).json({ error: 'Download not found' });
    return;
  }

  res.json(progress);
});

// Pause download
app.post('/api/download/pause/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const success = pauseDownload(jobId);

  if (!success) {
    res.status(404).json({ error: 'Download not found' });
    return;
  }

  res.json({ success: true });
});

// Resume download
app.post('/api/download/resume/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const options = resumeDownload(jobId);

  if (!options) {
    res.status(404).json({ error: 'Download not found or cannot be resumed' });
    return;
  }

  // Restart the download process in background (fire and forget for this request)
  // The frontend will poll for progress
  downloadVideo(options).catch(err => {
    console.error(`Resumed download failed [${jobId}]:`, err);
  });

  res.json({ success: true });
});

// Cancel download
app.post('/api/download/cancel/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  // Use correct relative path or require if needed
  // Since we are compiling, require is okay if it works, but better to import above.
  // However, circular deps concern. 
  // Let's use dynamic import for cancelDownload to be safe, matching original structure.
  const { cancelDownload } = require('./src/server/downloadManager.js');
  const success = cancelDownload(jobId);

  if (!success) {
    res.status(404).json({ error: 'Download not found' });
    return;
  }

  res.json({ success: true });
});

// SPA Fallback - serve index.html for all non-API routes
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Serving frontend from: ${distPath}`);
  console.log(`✓ Ready to accept connections...`);
});

// Keep the server process alive
setInterval(() => {
  // Empty interval to keep process alive
}, 30000);

server.on('error', (error: any) => {
  console.error('[SERVER ERROR]', error.code, error.message);
});

server.on('listening', () => {
  console.log('[LISTENING] Server is now listening');
});

process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT]', error.message, error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED]', reason);
});
