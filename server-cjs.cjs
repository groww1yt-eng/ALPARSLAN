#!/usr/bin/env node
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const PORT = 8080;
const distPath = path.join(__dirname, 'dist');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Metadata endpoint (stub - would call getVideoMetadata)
app.post('/api/metadata', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Import dynamically to avoid ESM issues
    const { getVideoMetadata } = await import('./src/server/metadata.js');
    const metadata = await getVideoMetadata(url);
    return res.json(metadata);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/api/metadata]', msg);
    return res.status(500).json({ error: msg });
  }
});

// Download endpoint
app.post('/api/download', async (req, res) => {
  try {
    const { url, videoId, jobId, outputFolder, mode, quality, format } = req.body;
    if (!url || !videoId || !jobId || !outputFolder || !mode) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
    
    const { downloadVideo, getFileSize } = await import('./src/server/download.js');
    const fileSize = await getFileSize(url, mode, quality);
    const result = await downloadVideo({ url, videoId, jobId, outputFolder, mode, quality, format, fileSize });
    return res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/api/download]', msg);
    return res.status(500).json({ error: msg });
  }
});

// Download progress
app.get('/api/download/progress/:jobId', async (req, res) => {
  try {
    const { getDownloadProgress } = await import('./src/server/downloadManager.js');
    const progress = getDownloadProgress(req.params.jobId);
    if (!progress) return res.status(404).json({ error: 'Not found' });
    return res.json(progress);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Pause/Resume
app.post('/api/download/pause/:jobId', async (req, res) => {
  try {
    const { pauseDownload } = await import('./src/server/downloadManager.js');
    const success = pauseDownload(req.params.jobId);
    if (!success) return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/download/resume/:jobId', async (req, res) => {
  try {
    const { resumeDownload } = await import('./src/server/downloadManager.js');
    const success = resumeDownload(req.params.jobId);
    if (!success) return res.status(404).json({ error: 'Not found' });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Serve static files
app.use(express.static(distPath));

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not found');
  }
});

// Start
app.listen(PORT, '127.0.0.1', () => {
  console.log(`✓ Server: http://localhost:${PORT}`);
  console.log(`✓ Frontend: ${distPath}`);
  console.log(`✓ Ready`);
});
