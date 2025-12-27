const activeDownloads = new Map();
export function getDownloadProgress(jobId) {
    const download = activeDownloads.get(jobId);
    if (!download)
        return null;
    // Update speed and ETA
    const now = Date.now();
    const timeDiff = (now - download.lastCheckTime) / 1000; // seconds
    if (timeDiff > 0.5) {
        // Update speed calculation
        const bytesDiff = download.progress.downloadedBytes - download.downloadedBytesAtLastCheck;
        const speed = bytesDiff / timeDiff;
        download.progress.speed = Math.max(0, speed);
        // Calculate ETA
        if (speed > 0 && download.progress.totalBytes > 0) {
            const remainingBytes = download.progress.totalBytes - download.progress.downloadedBytes;
            download.progress.eta = remainingBytes / speed;
        }
        download.downloadedBytesAtLastCheck = download.progress.downloadedBytes;
        download.lastCheckTime = now;
    }
    return { ...download.progress };
}
export function registerDownload(jobId, videoId, filePath, totalBytes) {
    const now = Date.now();
    activeDownloads.set(jobId, {
        videoId,
        process: null,
        isPaused: false,
        progress: {
            totalBytes,
            downloadedBytes: 0,
            percentage: 0,
            speed: 0,
            eta: 0,
            status: 'downloading',
        },
        startTime: now,
        downloadedBytesAtLastCheck: 0,
        lastCheckTime: now,
        filePath,
    });
}
export function updateProgress(jobId, downloadedBytes) {
    const download = activeDownloads.get(jobId);
    if (!download)
        return;
    download.progress.downloadedBytes = downloadedBytes;
    if (download.progress.totalBytes > 0) {
        download.progress.percentage = (downloadedBytes / download.progress.totalBytes) * 100;
    }
}
export function completeDownload(jobId, finalBytes) {
    const download = activeDownloads.get(jobId);
    if (!download)
        return;
    download.progress.status = 'completed';
    // If we have the actual final file size, update totalBytes to match
    // This ensures progress calculation is accurate
    if (finalBytes && finalBytes > 0) {
        download.progress.totalBytes = finalBytes;
        download.progress.downloadedBytes = finalBytes;
    }
    else {
        download.progress.downloadedBytes = download.progress.totalBytes;
    }
    download.progress.percentage = 100;
    download.progress.eta = 0;
}
export function failDownload(jobId, error) {
    const download = activeDownloads.get(jobId);
    if (!download)
        return;
    download.progress.status = 'failed';
    if (error) {
        download.progress.error = error;
    }
    if (download.process) {
        download.process.kill();
    }
}
export function pauseDownload(jobId) {
    const download = activeDownloads.get(jobId);
    if (!download || !download.process)
        return false;
    download.isPaused = true;
    download.progress.status = 'paused';
    // Send SIGSTOP to pause the process
    try {
        download.process.kill('SIGSTOP');
        return true;
    }
    catch (error) {
        console.error('Error pausing download:', error);
        return false;
    }
}
export function resumeDownload(jobId) {
    const download = activeDownloads.get(jobId);
    if (!download || !download.process)
        return false;
    download.isPaused = false;
    download.progress.status = 'downloading';
    // Send SIGCONT to resume the process
    try {
        download.process.kill('SIGCONT');
        return true;
    }
    catch (error) {
        console.error('Error resuming download:', error);
        return false;
    }
}
export function removeDownload(jobId) {
    activeDownloads.delete(jobId);
}
export function setDownloadProcess(jobId, process) {
    const download = activeDownloads.get(jobId);
    if (download) {
        download.process = process;
    }
}
