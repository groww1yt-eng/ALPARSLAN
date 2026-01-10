// Backend entrypoint (single source of truth)
//
// Architecture:
// - Development:
//   - Vite serves the frontend on :5173
//   - This Express server runs on :3001 and handles all /api/* routes
//   - Vite proxies /api and /health to this server (see vite.config.ts)
// - Production:
//   - Express serves the built frontend from ./dist and also provides /api/* routes
//   - Build output is generated into ./dist-server via `npm run build:server`
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
// Internal modules for core functionality
import { getVideoMetadata } from './src/server/metadata.js';
import { downloadVideo, getFileSize } from './src/server/download.js';
import { getDownloadProgress, pauseDownload, resumeDownload, cancelDownload, getActiveDownloads } from './src/server/downloadManager.js';
import { getNamingTemplates, setNamingTemplates } from './src/server/settingsStore.js';
import { validateTemplate, resolveFilename, getCurrentDate } from './src/server/namingResolver.js';
import { validateAndSanitizeUrl } from './src/server/validation.js';
import { API_VERSION } from './src/server/config.js';
import { getSystemInfo } from './src/server/system.js';
// Setup directory paths (ES modules work-around)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
// Set server port from environment or default to 3001
const PORT = parseInt(process.env.PORT || '3001', 10);
// -- Middleware --
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON request bodies
// -- Global Middleware --
// Attach API version to every response header
app.use((_req, res, next) => {
    res.setHeader('X-API-Version', API_VERSION);
    next();
});
// -- Static Files (Production) --
// Serve the built React frontend files from the 'dist' folder
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));
// -- API Routes --
// Health Check Endpoint
// Used by frontend to verify backend connectivity
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        version: API_VERSION,
        timestamp: new Date().toISOString()
    });
});
// Health check alias (root level)
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        version: API_VERSION,
        timestamp: new Date().toISOString()
    });
});
// GET /api/naming-templates
// Retrieve current file naming templates from persistence
app.get('/api/naming-templates', (_req, res) => {
    try {
        res.json({ namingTemplates: getNamingTemplates() });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
});
// PUT /api/naming-templates
// Update file naming templates
app.put('/api/naming-templates', (req, res) => {
    try {
        const { namingTemplates } = req.body;
        // Validate request body
        if (!namingTemplates) {
            res.status(400).json({ error: 'namingTemplates is required' });
            return;
        }
        setNamingTemplates(namingTemplates);
        res.json({ success: true, namingTemplates: getNamingTemplates() });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
});
// POST /api/metadata
// Fetch video title, thumbnail, and other info from YouTube URL
app.post('/api/metadata', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            res.status(400).json({ error: 'URL is required' });
            return;
        }
        try {
            // Validate and sanitize URL before processing
            const sanitizedUrl = validateAndSanitizeUrl(url);
            const metadata = await getVideoMetadata(sanitizedUrl); // Use sanitized URL
            res.json(metadata);
        }
        catch (e) {
            res.status(400).json({ error: e.message || 'Invalid or malicious URL' });
            return;
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error fetching metadata:', message);
        res.status(500).json({ error: message });
    }
});
// POST /api/filesize
// Estimate file size before downloading (uses yt-dlp simulation)
app.post('/api/filesize', async (req, res) => {
    try {
        const { url, mode, quality, format, playlistItems } = req.body;
        if (!url || !mode) {
            res.status(400).json({ error: 'URL and mode are required' });
            return;
        }
        let fileSize = 0;
        try {
            const sanitizedUrl = validateAndSanitizeUrl(url);
            // Get raw file size from yt-dlp (possibly with range/selection)
            fileSize = await getFileSize(sanitizedUrl, mode, quality, playlistItems);
        }
        catch (e) {
            res.status(400).json({ error: e.message || 'Invalid URL' });
            return;
        }
        // For audio mode, apply format-based multipliers (estimated overhead)
        // yt-dlp doesn't always report accurate audio size after conversion
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error getting file size:', message);
        res.status(500).json({ error: message, fileSize: 0 });
    }
});
// POST /api/download
// Start a new download job
app.post('/api/download', async (req, res) => {
    try {
        const { url, videoId, jobId, outputFolder, mode, quality, format, title, channel, index, contentType, downloadSubtitles, subtitleLanguage, createPerChannelFolder } = req.body;
        // Debug logging
        console.log('[DEBUG] Download request received:');
        console.log(`[DEBUG]   title: "${title}"`);
        console.log(`[DEBUG]   channel: "${channel}"`);
        console.log(`[DEBUG]   index: ${index}`);
        console.log(`[DEBUG]   contentType: "${contentType}"`);
        console.log(`[DEBUG]   mode: "${mode}", quality: "${quality}"`);
        console.log(`[DEBUG]   createPerChannelFolder: ${createPerChannelFolder}`);
        // Validate required parameters
        if (!url || !videoId || !jobId || !outputFolder || !mode) {
            res.status(400).json({ error: 'Missing required parameters: url, videoId, jobId, outputFolder, mode' });
            return;
        }
        // URL Validation
        let sanitizedUrl = url;
        try {
            sanitizedUrl = validateAndSanitizeUrl(url);
        }
        catch (e) {
            res.status(400).json({ error: e.message || 'Invalid URL' });
            return;
        }
        // -- Naming Logic --
        // Get naming template from settings
        const templates = getNamingTemplates();
        const actualContentType = contentType || 'single';
        const actualMode = mode;
        const template = templates[actualContentType][actualMode];
        // Validate template before starting download (backend-enforced)
        const validation = validateTemplate(template, actualContentType, actualMode);
        if (!validation.valid) {
            res.status(400).json({
                error: validation.message,
                type: 'naming_validation',
                validationType: validation.type
            });
            return;
        }
        // Resolve the filename using the template variables
        const resolvedFilename = resolveFilename({
            template,
            title: title || 'Unknown Video',
            channel: channel || 'Unknown Channel',
            quality: quality,
            format: mode === 'audio' ? (format || 'mp3') : 'mp4',
            index: index,
            date: getCurrentDate(),
            mode: actualMode,
            contentType: actualContentType,
        });
        console.log(`[NAMING] Template: "${template}"`);
        console.log(`[NAMING] Resolved: "${resolvedFilename}"`);
        // Get file size first (for progress tracking initialization)
        const fileSize = await getFileSize(url, mode, quality);
        // -- Start Download --
        // Run download in background (fire and forget pattern)
        // The frontend will poll /api/download/progress/:jobId for status updates
        downloadVideo({
            url,
            videoId,
            jobId,
            outputFolder,
            mode,
            quality,
            format,
            fileSize,
            resolvedFilename,
            downloadSubtitles,
            subtitleLanguage,
            createPerChannelFolder,
            channel: channel || 'Unknown Channel', // Ensure channel is passed for folder creation
        }).catch(err => {
            console.error(`Background download failed for ${jobId}:`, err);
            // Note: Error is already handled/logged in downloadVideo via failDownload
        });
        // Return success immediately with Job ID
        res.json({
            success: true,
            jobId,
            status: 'queued',
            message: 'Download started in background'
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Handle expected interruptions (Pause/Cancel) gracefully
        if (message === 'Download paused' || message === 'Download canceled') {
            res.json({ success: true, status: message.toLowerCase().replace('download ', '') });
            return;
        }
        console.error('Error starting video download:', message);
        res.status(500).json({ error: message });
    }
});
// GET /api/downloads/active
// List current active downloads (used for restoring state on refresh)
app.get('/api/downloads/active', (_req, res) => {
    try {
        const downloads = getActiveDownloads();
        res.json({ downloads });
    }
    catch (error) {
        console.error('Error fetching active downloads:', error);
        res.status(500).json({ error: 'Failed to fetch active downloads' });
    }
});
// GET /api/download/progress/:jobId
// Poll specific download progress
app.get('/api/download/progress/:jobId', (req, res) => {
    const { jobId } = req.params;
    const progress = getDownloadProgress(jobId);
    if (!progress) {
        res.status(404).json({ error: 'Download not found' });
        return;
    }
    res.json(progress);
});
// POST /api/download/pause/:jobId
// Pause a running download
app.post('/api/download/pause/:jobId', (req, res) => {
    const { jobId } = req.params;
    const success = pauseDownload(jobId);
    if (!success) {
        res.status(404).json({ error: 'Download not found' });
        return;
    }
    res.json({ success: true });
});
// POST /api/download/resume/:jobId
// Resume a paused download
app.post('/api/download/resume/:jobId', async (req, res) => {
    const { jobId } = req.params;
    const options = resumeDownload(jobId);
    if (!options) {
        res.status(404).json({ error: 'Download not found or cannot be resumed' });
        return;
    }
    // Restart the download process in background using stored options
    void downloadVideo(options).catch((error) => {
        console.error(`Resumed download failed [${jobId}]:`, error);
    });
    res.json({ success: true });
});
// POST /api/download/cancel/:jobId
// Cancel and cleanup a download
app.post('/api/download/cancel/:jobId', (req, res) => {
    const { jobId } = req.params;
    const success = cancelDownload(jobId);
    if (!success) {
        res.status(404).json({ error: 'Download not found' });
        return;
    }
    res.json({ success: true });
});
// GET /api/system-info
// Fetch system specs (CPU, RAM, Disk)
app.get('/api/system-info', async (req, res) => {
    try {
        const outputPath = req.query.outputPath;
        const info = await getSystemInfo(outputPath);
        res.json(info);
    }
    catch (error) {
        console.error('Error fetching system info:', error);
        res.status(500).json({ error: 'Failed to fetch system info' });
    }
});
// SPA Fallback
// Return index.html for any unknown route so React Router can handle it on frontend
app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});
// -- Server Startup --
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ Serving frontend from: ${distPath}`);
    console.log(`✓ Ready to accept connections...`);
});
// Keep the server process alive (prevent idle termination in some envs)
setInterval(() => {
    // Empty interval to keep process alive
}, 30000);
// Error Handling & Logging
server.on('error', (error) => {
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
