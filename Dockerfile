# Use Node.js 20 Debian Slim image as a base
FROM node:20-bookworm-slim

# Set working directory inside the container
WORKDIR /app

# Install system dependencies:
# - python3: required by yt-dlp
# - ffmpeg: required for audio extraction/conversion and video merging
# - curl: to download yt-dlp
RUN apt-get update && \
    apt-get install -y python3 ffmpeg curl && \
    rm -rf /var/lib/apt/lists/*

# Download the latest yt-dlp binary directly from GitHub and make it executable
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Copy package files first to leverage Docker's layer caching
COPY package.json package-lock.json ./

# Install all Node.js dependencies (including dev tools needed for building)
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the frontend (Vite) and backend server (TSC)
RUN npm run build:all

# Set environment variables for production
ENV NODE_ENV=production
# Render automatically assigns an exposed PORT, defaulting to 10000 here
ENV PORT=10000

# Expose the standard Render port
EXPOSE 10000

# Start the Node.js production server
CMD ["npm", "start"]
