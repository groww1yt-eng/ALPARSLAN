# Use Node.js 20 Debian Slim image as a base
FROM node:20-bookworm-slim

# Set working directory inside the container
WORKDIR /app

# Install system dependencies:
# - python3 & python3-pip: required by yt-dlp python module
# - python-is-python3: aliases `python` to `python3`
# - ffmpeg: required for audio/video merging
# - chromium: required by the getpot-wpc plugin for headless browser token generation
RUN apt-get update && \
    apt-get install -y python3 python3-pip python-is-python3 ffmpeg chromium && \
    rm -rf /var/lib/apt/lists/*

# Install the latest yt-dlp and the automated PO token provider plugin
RUN pip3 install --break-system-packages yt-dlp yt-dlp-getpot-wpc nodriver

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
