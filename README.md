# ALPARSLAN - Advanced YouTube Downloader

ALPARSLAN is a powerful, locally-hosted YouTube downloader web application. It allows you to download videos, audio, and playlists from YouTube with advanced control over quality, format, and file naming. It leverages `yt-dlp` for robust download capabilities and provides a modern, responsive web interface.

## 🚀 Key Features

*   **Video & Audio Downloads**: Download videos in various resolutions (up to 4K) or extract audio in multiple formats (MP3, M4A, WAV, etc.).
*   **Playlist Support**: Download entire playlists with selective filtering (range or manual selection).
*   **Custom Naming**: Define powerful naming templates using variables like `{title}`, `{channel}`, `{date}`, `{quality}`, etc.
*   **Metadata Embedding**: Automatically embeds metadata (title, artist, album art) into downloaded files.
*   **Subtitle Support**: Download and embed subtitles (Auto-generated or specific languages).
*   **Queue Management**: Real-time progress tracking, pause/resume/cancel capabilities for active downloads.
*   **Per-Channel Organization**: Automatically sort downloads into channel-specific subfolders.
*   **Dark Mode**: Sleek, modern user interface with dark mode support.

## 🛠️ Technology Stack

*   **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui
*   **Backend**: Node.js, Express
*   **Core Engine**: `yt-dlp` (Python-based command-line tool)
*   **State Management**: Zustand (with persistence)
*   **Validation**: Zod

## 📋 Prerequisites

Before setting up the project, ensure you have the following installed:

1.  **Node.js** (v18 or higher)
2.  **FFmpeg**: Required for media merging and format conversion.
    *   *Windows*: `winget install ffmpeg` or download from [ffmpeg.org](https://ffmpeg.org/) and add to PATH.
    *   *Mac*: `brew install ffmpeg`
    *   *Linux*: `sudo apt install ffmpeg`
3.  **Python**: Required for `yt-dlp` to run (unless using the binary).

## ⚡ Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/ALPARSLAN.git
    cd ALPARSLAN
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Environment**:
    Based on the `.env.example`, create a `.env` file if needed, though the defaults usually work for local development.

## 🏃 Usage

### Running Locally

To start both the backend server and the frontend development server concurrently:

```bash
npm run dev:all
```

*   **Frontend**: http://localhost:5173
*   **Backend**: http://localhost:3001

### Building for Production

To build the frontend and backend for production usage:

```bash
npm run build:all
```

To run the production server:

```bash
npm run start
```

## ⚙️ Configuration

The project uses several configuration files. Here's a quick guide:

*   **`vite.config.ts`**: Configures the Vite dev server, including proxy settings (`/api` -> `localhost:3001`) to avoid CORS issues during development.
*   **`server.ts`**: The main entry point for the Express backend.
*   **`src/server/config.ts`**: Contains backend-specific constants like `API_VERSION`.
*   **`tailwind.config.ts`**: Configuration for Tailwind CSS styling and branding.

## 📝 Usage Guide

1.  **Dashboard**: Paste a YouTube link in the input field and click "Fetch".
2.  **Selection**: Choose "Video" or "Audio" mode. Select specific videos if it's a playlist.
3.  **Options**: Configure quality (e.g., 1080p), format (e.g., MP3), and whether to download subtitles.
4.  **Download**: Click "Start Download". The job will appear in the queue with a progress bar.
5.  **Files**: Downloads are saved to the `downloads` folder in the project root by default (or the configured output path).

## 🤝 Contributing

Contributions are welcome!
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.
