# Use Node.js 20 Debian Slim image as a base
FROM node:20-bookworm-slim

# Set working directory inside the container
WORKDIR /app

# Install system dependencies:
# - python3 & python3-pip: required by yt-dlp python module
# - ffmpeg: required for audio extraction/conversion and video merging
RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Install the latest yt-dlp via pip so it can be executed as a python module
RUN pip3 install --break-system-packages yt-dlp

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
