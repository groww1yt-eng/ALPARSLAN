const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const PORT = 8080;
const distPath = path.join(__dirname, 'dist');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/metadata', (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  // Placeholder: would call yt-dlp here
  res.json({
    id: 'test',
    title: 'Test Video',
    channel: 'Test Channel',
    thumbnail: '',
    duration: '3:33',
    durationSeconds: 213,
    isPlaylist: false
  });
});

app.use(express.static(distPath));

app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not found');
  }
});

const server = app.listen(PORT, '127.0.0.1');

server.on('listening', () => {
  console.log(`✓ http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
