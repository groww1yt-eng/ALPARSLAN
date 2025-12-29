# Real YouTube Data Integration - Setup Guide

## Prerequisites

You need **yt-dlp** installed on your system to fetch real YouTube metadata.

### Install yt-dlp

**Windows:**
```powershell
# Using pip
pip install yt-dlp

# Or using choco
choco install yt-dlp
```

**macOS:**
```bash
brew install yt-dlp
```

**Linux:**
```bash
sudo apt install yt-dlp
# or
pip install yt-dlp
```

**Verify installation:**
```bash
yt-dlp --version
```

## Architecture

The app now uses a **two-tier architecture**:

1. **Backend (Node.js + Express)** - Runs on port 3001
   - Uses `yt-dlp` to fetch real YouTube metadata
   - Parses video/playlist information
   - Provides REST API endpoints

2. **Frontend (React + Vite)** - Runs on port 5173
   - Calls backend API to get real metadata
   - No more fake demo data

## Running the Application

### Option 1: Run Both Simultaneously (Recommended)
```bash
npm run dev:all
```

This runs both the backend server and frontend dev server in parallel.

### Option 2: Run Separately

**Terminal 1 - Start Backend:**
```bash
npm run server
```

Backend will start on `http://localhost:3001`

**Terminal 2 - Start Frontend:**
```bash
npm run dev
```

Frontend will start on `http://localhost:5173`

## API Endpoints

### POST `/api/metadata`
Fetch metadata for a YouTube video or playlist.

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response - Single Video:**
```json
{
  "id": "q7HnfHFJCEc",
  "title": "Mehmed Fetihler Sultanı 2. Sezon 2.Tanıtımı @trt1",
  "channel": "Mehmed: Fetihler Sultanı",
  "thumbnail": "https://...",
  "duration": "1:10",
  "durationSeconds": 70,
  "isPlaylist": false
}
```

**Response - Playlist:**
```json
{
  "id": "PLxxxxxx",
  "title": "Full Playlist Title",
  "channel": "Channel Name",
  "thumbnail": "https://...",
  "duration": "25 videos",
  "durationSeconds": 0,
  "isPlaylist": true,
  "playlistTitle": "Full Playlist Title",
  "videoCount": 25,
  "videos": [
    {
      "id": "video1_id",
      "index": 1,
      "title": "Video 1 Title",
      "duration": "10:45",
      "thumbnail": "https://...",
      "selected": false
    },
    // ... more videos
  ]
}
```

## Features

✅ **Real YouTube Data** - No more fake metadata  
✅ **Single Videos** - Title, duration, thumbnail, channel  
✅ **Playlists** - Full video list with order/index  
✅ **Video Count** - Accurate playlist video count  
✅ **Error Handling** - User-friendly error messages  

## Troubleshooting

### "yt-dlp: command not found"
Make sure yt-dlp is installed and in your PATH.

```bash
# Verify
yt-dlp --version

# Reinstall if needed
pip install --upgrade yt-dlp
```

### Backend fails to start
- Make sure port 3001 is not in use
- Check that yt-dlp is installed
- Try running: `npm run server` to see error details

### "Failed to fetch metadata" error
- Check if the URL is a valid YouTube URL
- The video/playlist might be private or deleted
- YouTube might be blocking requests (temporary)

### Frontend can't connect to backend
- Make sure backend is running on port 3001
- Check VITE_API_URL in `.env.local`
- Check browser console for CORS errors

## Configuration

Edit `.env.local` to change the backend URL:

```env
VITE_API_URL=http://localhost:3001
```

For production, update this to your deployed backend URL.

## File Structure

```
src/
├── lib/
│   ├── api.ts (NEW) - Frontend API client
│   └── demoData.ts - Utility functions (calculateFileSize, etc)
├── server/
│   └── metadata.ts (NEW) - yt-dlp integration
└── pages/
    └── Dashboard.tsx (UPDATED) - Now uses real API
```

## Environment Variables

Create `.env.local`:
```env
VITE_API_URL=http://localhost:3001
```

## Notes

- The backend uses `executeSync` with yt-dlp for simplicity
- For production, consider using an async queue system
- Large playlists might take longer to fetch (YouTube has lots of videos)
