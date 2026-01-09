# ALPARSLAN API Documentation

The backend runs on **port 3001** (by default) and serves the API at `/api`.

## Base URL
`http://localhost:3001` (or your configured host).

## Endpoints

### 1. Health Check
Check if the server is running.

- **Endpoint**: `GET /api/health`
- **Response**:
  ```json
  {
    "status": "ok",
    "version": "1.0.0",
    "timestamp": "2023-10-27T10:00:00.000Z"
  }
  ```

### 2. Get System Info
Retrieve system storage and memory information.

- **Endpoint**: `GET /api/system-info`
- **Query Params**:
  - `outputPath` (optional): Path to check disk space for.
- **Response**:
  ```json
  {
    "storage": {
      "total": 1000000000,
      "free": 500000000,
      "used": 500000000,
      "percent": 50
    },
    "memory": {
      "total": 16000000000,
      "free": 8000000000,
      "used": 8000000000
    }
  }
  ```

### 3. Fetch Metadata
Get details about a YouTube video or playlist.

- **Endpoint**: `POST /api/metadata`
- **Request Body**:
  ```json
  {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID"
  }
  ```
- **Response**:
  ```json
  {
    "id": "VIDEO_ID",
    "title": "Video Title",
    "channel": "Channel Name",
    "duration": 120,
    "thumbnail": "https://example.com/thumb.jpg",
    "views": 1000000,
    "uploadDate": "2023-01-01"
  }
  ```
- **Error (400)**: Invalid URL or scraper error.

### 4. Get Estimated File Size
Estimate the size of the download before starting.

- **Endpoint**: `POST /api/filesize`
- **Request Body**:
  ```json
  {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "mode": "video", // or "audio"
    "quality": "1080p",
    "format": "mp4", // optional
    "playlistItems": "1,2,5-10" // optional, for playlists
  }
  ```
- **Response**:
  ```json
  {
    "fileSize": 52428800 // in bytes
  }
  ```

### 5. Start Download
Initiate a download job.

- **Endpoint**: `POST /api/download`
- **Request Body**:
  ```json
  {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "videoId": "VIDEO_ID",
    "jobId": "unique-uuid-v4",
    "outputFolder": "/path/to/downloads",
    "mode": "video", // "video" | "audio"
    "quality": "1080p",
    "format": "mp4",
    "title": "Video Title",
    "channel": "Channel Name",
    "createPerChannelFolder": true,
    "downloadSubtitles": true,
    "subtitleLanguage": "en"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "jobId": "unique-uuid-v4",
    "status": "queued",
    "message": "Download started in background"
  }
  ```

### 6. Get Download Progress
Poll this endpoint to track a specific job.

- **Endpoint**: `GET /api/download/progress/:jobId`
- **Response**:
  ```json
  {
    "jobId": "unique-uuid-v4",
    "progress": 45.5, // 0-100
    "speed": 1024000, // bytes/sec
    "eta": 60, // seconds
    "status": "downloading" // "queued" | "downloading" | "converting" | "completed" | "error"
  }
  ```

### 7. Control Downloads
Manage active downloads.

- **Pause**: `POST /api/download/pause/:jobId`
- **Resume**: `POST /api/download/resume/:jobId`
- **Cancel**: `POST /api/download/cancel/:jobId`

### 8. Naming Templates
Manage custom filename templates.

- **Get Templates**: `GET /api/naming-templates`
- **Update Templates**: `PUT /api/naming-templates`
  - **Body**: `{ "namingTemplates": { ... } }`
