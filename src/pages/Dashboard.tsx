import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { fetchMetadata, downloadVideo as apiDownloadVideo, getDownloadProgress, pauseDownload, resumeDownload, getEstimatedFileSize, fetchActiveDownloads } from '@/lib/api';
import { isValidYouTubeUrl, validateAndSanitizeUrl } from '@/lib/demoData';
import { PlaylistSelector } from '@/components/PlaylistSelector';
import { NamingOptions } from '@/components/NamingOptions';
import { Switch } from '@/components/ui/switch';
import { Link2, Video, Music, Download, Settings2, Loader2, ListVideo, Type } from 'lucide-react';
import type { DownloadMode, VideoQuality, AudioFormat, PlaylistMode, PlaylistVideo, ContentType } from '@/types';
import { cn } from '@/lib/utils';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ScrollingTitle from '@/components/ScrollingTitle';
import StartDownloadButton from '@/components/StartDownloadButton';
import { handleAppError } from '@/lib/errorHandler';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function Dashboard() {
  const { settings, currentMetadata, setCurrentMetadata, addJob, addNotification, updateJob, addToHistory } = useAppStore();

  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<DownloadMode>(settings.defaultMode);
  const [quality, setQuality] = useState<VideoQuality>(settings.defaultQuality);
  const [format, setFormat] = useState<AudioFormat>(settings.defaultFormat);
  const [downloadSubs, setDownloadSubs] = useState(settings.downloadSubtitles);
  const [playlistMode, setPlaylistMode] = useState<PlaylistMode>('all');
  const [rangeStart, setRangeStart] = useState('1');
  const [rangeEnd, setRangeEnd] = useState('10');
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<PlaylistVideo[]>([]);
  const [currentNamingTemplate, setCurrentNamingTemplate] = useState('');
  const [estimatedSize, setEstimatedSize] = useState<string>('Calculating...');
  const [isCalculatingSize, setIsCalculatingSize] = useState(false);

  useEffect(() => {
    if (currentMetadata?.isPlaylist && currentMetadata.videoCount) {
      setRangeStart('1');
      setRangeEnd(String(currentMetadata.videoCount));
    }
  }, [currentMetadata]);

  // Sync active downloads on mount (background persistence)
  useEffect(() => {
    const syncDownloads = async () => {
      try {
        const { downloads } = await fetchActiveDownloads();

        // Update local state for each active download
        Object.entries(downloads).forEach(([jobId, progress]) => {
          // Check if job exists in store
          const existingJob = useAppStore.getState().jobs.find(j => j.id === jobId);

          if (existingJob) {
            // If job is already completed/failed, don't revert state
            if (existingJob.status === 'completed' || existingJob.status === 'failed') return;

            // Resume polling for this job
            pollDownloadProgress(jobId, {
              title: existingJob.title,
              channel: existingJob.channel,
              thumbnail: existingJob.thumbnail,
              mode: existingJob.mode,
              quality: existingJob.quality,
              format: existingJob.format
            });
          }
        });
      } catch (error) {
        console.error('Failed to sync downloads:', error);
      }
    };

    syncDownloads();
  }, []);

  // Poll progress for a specific job
  const pollDownloadProgress = (jobId: string, details: { title: string, channel: string, thumbnail: string, mode: DownloadMode, quality?: VideoQuality, format?: AudioFormat }) => {
    let progressInterval: NodeJS.Timeout | null = null;
    let lastFileSize = 'Calculating...';

    progressInterval = setInterval(async () => {
      try {
        const progress = await getDownloadProgress(jobId);

        // Calculate file size - use total bytes if available
        let displayFileSize = lastFileSize;
        if (progress.totalBytes > 0) {
          displayFileSize = `${(progress.totalBytes / (1024 * 1024)).toFixed(2)} MB`;
          lastFileSize = displayFileSize;
        }

        const downloadedSize = progress.downloadedBytes > 0
          ? `${(progress.downloadedBytes / (1024 * 1024)).toFixed(2)} MB`
          : '0 MB';

        const speed = progress.speed > 0
          ? `${(progress.speed / (1024 * 1024)).toFixed(2)} MB/s`
          : '0 MB/s';

        const etaSeconds = Math.ceil(progress.eta);
        const etaMinutes = Math.floor(etaSeconds / 60);
        const etaSecs = etaSeconds % 60;
        const eta = `${etaMinutes}:${etaSecs.toString().padStart(2, '0')}`;

        updateJob(jobId, {
          status: progress.status as any, // Sync status (downloading, paused, etc)
          progress: isNaN(progress.percentage) ? 0 : Math.min(100, progress.percentage),
          fileSize: displayFileSize,
          downloadedSize,
          speed,
          eta,
        });

        // Stop polling when completed or failed
        if (progress.status === 'completed' || progress.status === 'failed' || progress.status === 'canceled') {
          if (progressInterval) {
            clearInterval(progressInterval);
          }

          if (progress.status === 'completed' && progress.result) {
            // Actual completion - update job status to completed with actual file size from result
            updateJob(jobId, {
              status: 'completed' as const,
              progress: 100,
              fileSize: progress.result.fileSize,
              downloadedSize: progress.result.fileSize,
              eta: '0:00',
              speed: '0 MB/s',
              completedAt: new Date(),
            });

            // Add to history
            addToHistory({
              id: crypto.randomUUID(),
              title: details.title,
              channel: details.channel,
              thumbnail: details.thumbnail,
              mode: details.mode,
              quality: details.quality,
              format: details.format,
              fileSize: progress.result.fileSize,
              filePath: progress.result.filePath,
              completedAt: new Date(),
            });

            addNotification({
              type: 'success',
              title: 'Download Complete',
              message: `${details.title} (${progress.result.fileSize}) saved`,
            });
          }
        }
      } catch (error) {
        console.error(`Polling error for ${jobId}:`, error);
        if (progressInterval) clearInterval(progressInterval);
      }
    }, 500);
  };

  // Determine content type based on metadata
  const contentType: ContentType = currentMetadata?.isPlaylist ? 'playlist' : 'single';

  // Update naming template when content type or mode changes
  useEffect(() => {
    if (settings.namingTemplates && settings.namingTemplates[contentType]) {
      const template = settings.namingTemplates[contentType][mode];
      if (template) {
        setCurrentNamingTemplate(template);
      }
    }
  }, [contentType, mode, settings.namingTemplates]);

  const handleFetchMetadata = async () => {
    if (!url.trim()) {
      addNotification({ type: 'error', title: 'Empty URL', message: 'Please enter a YouTube URL' });
      return;
    }
    if (!isValidYouTubeUrl(url)) {
      addNotification({ type: 'error', title: 'Invalid URL', message: 'Please enter a valid YouTube URL' });
      return;
    }

    setIsLoading(true);
    try {
      // Calculate sanitized URL
      const sanitizedUrl = validateAndSanitizeUrl(url);

      const metadata = await fetchMetadata(sanitizedUrl);
      setCurrentMetadata(metadata);

      // Initialize selected videos empty for playlists (user must select)
      if (metadata?.videos) {
        setSelectedVideos(metadata.videos); // Already set to selected: false
      }

      addNotification({ type: 'success', title: 'Fetched!', message: metadata?.title || 'Video info loaded' });
    } catch (error) {
      handleAppError(error, { title: 'Error', defaultMessage: 'Failed to fetch metadata' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
      handleFetchMetadata();
    }
  };

  // Fetch estimated file size from backend when parameters change
  useEffect(() => {
    // Only fetch if we have metadata and url
    if (!currentMetadata || !url) {
      setEstimatedSize('--');
      return;
    }

    // Fetch real file size from backend
    const fetchSize = async () => {
      // Check if aborted before starting (double check)
      if (currentController.signal.aborted) return;

      setIsCalculatingSize(true);
      setEstimatedSize('Calculating...');

      try {
        // Calculate playlistItems string for the backend if in playlist mode
        let playlistItems: string | undefined = undefined;
        if (currentMetadata.isPlaylist) {
          if (playlistMode === 'range') {
            const maxCount = currentMetadata.videoCount ?? currentMetadata.videos?.length ?? 0;
            const startStr = rangeStart.trim();
            const endStr = rangeEnd.trim();

            const startNum = startStr === '' ? NaN : Number(startStr);
            const endNum = endStr === '' ? NaN : Number(endStr);

            if (!Number.isInteger(startNum)) {
              if (!currentController.signal.aborted) {
                setEstimatedSize('Start must be a number');
                setIsCalculatingSize(false);
              }
              return;
            }
            if (!Number.isInteger(endNum)) {
              if (!currentController.signal.aborted) {
                setEstimatedSize('End must be a number');
                setIsCalculatingSize(false);
              }
              return;
            }
            if (startNum < 1) {
              if (!currentController.signal.aborted) {
                setEstimatedSize('Start must be at least 1');
                setIsCalculatingSize(false);
              }
              return;
            }
            if (endNum < 1) {
              if (!currentController.signal.aborted) {
                setEstimatedSize('End must be at least 1');
                setIsCalculatingSize(false);
              }
              return;
            }
            if (maxCount > 0 && startNum > maxCount) {
              if (!currentController.signal.aborted) {
                setEstimatedSize(`Start cannot exceed ${maxCount}`);
                setIsCalculatingSize(false);
              }
              return;
            }
            if (maxCount > 0 && endNum > maxCount) {
              if (!currentController.signal.aborted) {
                setEstimatedSize(`End cannot exceed ${maxCount}`);
                setIsCalculatingSize(false);
              }
              return;
            }
            if (startNum > endNum) {
              if (!currentController.signal.aborted) {
                setEstimatedSize('Start must be less than or equal to end');
                setIsCalculatingSize(false);
              }
              return;
            }

            playlistItems = `${startNum}-${endNum}`;
          } else if (playlistMode === 'manual') {
            // Use selectedVideos state which contains the latest selection status
            const sourceVideos = selectedVideos.length > 0 ? selectedVideos : (currentMetadata.videos || []);
            const selectedIndices = sourceVideos
              .map((v, i) => v.selected ? v.index : null) // Use v.index (original index)
              .filter(idx => idx !== null);

            if (selectedIndices.length === 0) {
              if (!currentController.signal.aborted) {
                setEstimatedSize('No videos selected');
                setIsCalculatingSize(false);
              }
              return;
            }
            playlistItems = selectedIndices.join(',');
          }
        }

        const result = await getEstimatedFileSize(
          url,
          mode,
          quality,
          format,
          playlistItems,
          currentController.signal
        );

        if (currentController.signal.aborted) return;

        if (result.fileSize > 0) {
          // Format the size
          const sizeMB = result.fileSize / (1024 * 1024);
          if (sizeMB >= 1024) {
            setEstimatedSize(`${(sizeMB / 1024).toFixed(2)} GB`);
          } else {
            setEstimatedSize(`${sizeMB.toFixed(2)} MB`);
          }
        } else {
          setEstimatedSize('--');
        }
      } catch (error) {
        if (currentController.signal.aborted) return;

        // Only log/notify if not an abort error
        if (error instanceof Error && error.name === 'AbortError') {
          // Ignore abort errors
          return;
        }

        handleAppError(error, { title: 'Error', defaultMessage: 'Error fetching file size', notify: false, logLabel: 'Error fetching file size:' });
        setEstimatedSize('--');
      } finally {
        if (!currentController.signal.aborted) {
          setIsCalculatingSize(false);
        }
      }
    };

    const currentController = new AbortController();
    // Debounce the API call slightly
    const timeoutId = setTimeout(fetchSize, 500); // 500ms since playlist can be heavy

    return () => {
      clearTimeout(timeoutId);
      currentController.abort();
    };
  }, [url, currentMetadata, mode, quality, format, playlistMode, rangeStart, rangeEnd, selectedVideos]);

  const handleStartDownload = async () => {
    if (!currentMetadata) return;

    const processDownload = async (videoId: string, title: string, videoUrl: string, thumbnail: string, playlistIndex?: number) => {
      const jobId = crypto.randomUUID();


      const newJob = {
        id: jobId,
        videoId,
        title,
        channel: currentMetadata.channel,
        thumbnail, // Use individual video thumbnail, not playlist thumbnail
        mode,
        quality: mode === 'video' ? quality : undefined,
        format: mode === 'audio' ? format : undefined,
        status: 'downloading' as const,
        progress: 0,
        speed: '0 MB/s',
        eta: '--',
        fileSize: 'Calculating...', // Show "Calculating..." instead of estimate
        downloadedSize: '0 MB',
        createdAt: new Date(),
      };

      addJob(newJob);

      // Guard against first-time incomplete state
      if (!videoUrl || !videoId || !settings.outputFolder || !mode) {
        throw new Error("Download not ready yet. Please wait a moment and try again.");
      }

      // Show notification that download started
      addNotification({
        type: 'info',
        title: 'Download Starting',
        message: `Downloading ${title}...`,
        duration: 3000,
      });

      try {
        // Call the actual download API
        // This is now fire-and-forget on the backend
        const response = await apiDownloadVideo(
          videoUrl,
          videoId,
          jobId,
          settings.outputFolder,
          mode,
          quality,
          format,
          {
            title,
            channel: currentMetadata.channel,
            index: playlistIndex,
            contentType: currentMetadata.isPlaylist ? 'playlist' : 'single',
          },
          {
            downloadSubtitles: settings.downloadSubtitles,
            subtitleLanguage: settings.subtitleLanguage,
            createPerChannelFolder: settings.perChannelFolders,
          }
        );

        if (response.success) {
          // Start polling (background handled by backend)
          pollDownloadProgress(jobId, {
            title,
            channel: currentMetadata.channel,
            thumbnail,
            mode,
            quality: mode === 'video' ? quality : undefined,
            format: mode === 'audio' ? format : undefined
          });
        } else {
          throw new Error(response.status || "Failed to start");
        }

      } catch (error) {
        const message = handleAppError(error, {
          title: 'Download Failed',
          defaultMessage: 'Unknown error',
          userMessagePrefix: title,
        });

        // Update job status to failed
        updateJob(jobId, {
          status: 'failed' as const,
          error: message,
        });
      }
    };

    if (currentMetadata.isPlaylist && currentMetadata.videos) {
      // Determine which videos to download based on playlist mode
      let videosToDownload: PlaylistVideo[] = [];

      if (playlistMode === 'all') {
        videosToDownload = currentMetadata.videos;
      } else if (playlistMode === 'range') {
        const maxCount = currentMetadata.videos.length;
        const startStr = rangeStart.trim();
        const endStr = rangeEnd.trim();

        const startNum = startStr === '' ? NaN : Number(startStr);
        const endNum = endStr === '' ? NaN : Number(endStr);

        if (!Number.isInteger(startNum)) {
          addNotification({
            type: 'error',
            title: 'Invalid Range',
            message: 'Start must be a number',
          });
          return;
        }
        if (!Number.isInteger(endNum)) {
          addNotification({
            type: 'error',
            title: 'Invalid Range',
            message: 'End must be a number',
          });
          return;
        }
        if (startNum < 1) {
          addNotification({
            type: 'error',
            title: 'Invalid Range',
            message: 'Start must be at least 1',
          });
          return;
        }
        if (endNum < 1) {
          addNotification({
            type: 'error',
            title: 'Invalid Range',
            message: 'End must be at least 1',
          });
          return;
        }
        if (startNum > maxCount) {
          addNotification({
            type: 'error',
            title: 'Invalid Range',
            message: `Start cannot exceed ${maxCount} (playlist has ${maxCount} videos)`,
          });
          return;
        }
        if (endNum > maxCount) {
          addNotification({
            type: 'error',
            title: 'Invalid Range',
            message: `End cannot exceed ${maxCount} (playlist has ${maxCount} videos)`,
          });
          return;
        }
        if (startNum > endNum) {
          addNotification({
            type: 'error',
            title: 'Invalid Range',
            message: 'Start must be less than or equal to end',
          });
          return;
        }

        videosToDownload = currentMetadata.videos.slice(startNum - 1, endNum);
      } else if (playlistMode === 'manual') {
        videosToDownload = selectedVideos.filter(v => v.selected);
      }

      if (videosToDownload.length === 0) {
        addNotification({ type: 'error', title: 'No Videos Selected', message: 'Please select at least one video to download' });
        return;
      }

      addNotification({
        type: 'info',
        title: 'Downloads Started',
        message: `Starting ${videosToDownload.length} video downloads`
      });

      // Download each video sequentially
      for (const video of videosToDownload) {
        // CRITICAL: Use individual video URL, NOT playlist URL
        // yt-dlp with playlist URL downloads from #1 regardless of video.id
        const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
        await processDownload(video.id, video.title, videoUrl, video.thumbnail, video.index);
      }
    } else {
      // Single video download (no playlist index)
      await processDownload(currentMetadata.id, currentMetadata.title, url, currentMetadata.thumbnail);
    }

    setCurrentMetadata(null);
    setUrl('');
  };

  // Get selected count for manual mode
  const selectedCount = selectedVideos.filter(v => v.selected).length;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* URL Input */}
      <div className="card-elevated p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Link2 className="w-4 h-4" /> Video/Playlist URL
        </h3>
        <div className="flex gap-2">

          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://youtube.com/watch?v=..."
            className="flex-1"
          />

          <Button
            onClick={handleFetchMetadata}
            disabled={isLoading}
            className="px-6"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Fetch'}
          </Button>

        </div>
      </div>

      {/* Metadata Preview */}
      {currentMetadata && (
        <div className="card-elevated p-4 flex gap-4">
          <img src={currentMetadata.thumbnail} alt="" className="w-32 h-20 object-cover rounded-lg" />
          <div className="flex-1 min-w-0">
            <ScrollingTitle className="font-semibold">
              {currentMetadata.title}
            </ScrollingTitle>
            <p className="text-sm text-muted-foreground">{currentMetadata.channel}</p>
            <p className="text-xs text-primary mt-1">
              {currentMetadata.duration}
              {currentMetadata.isPlaylist}
            </p>
          </div>
        </div>
      )}

      {/* Download Mode */}
      <div className="card-elevated p-4 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Settings2 className="w-4 h-4" /> Download Options</h3>

        <div className="grid grid-cols-2 gap-2">

          <button
            onClick={() => setMode('video')}
            className={cn(
              'flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-300 ease-out',
              mode === 'video'
                ? 'gradient-primary text-white'
                : 'px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium transition-colors'
            )}>
            <Video className="w-5 h-5" />
            Video + Audio
          </button>

          <button
            onClick={() => setMode('audio')}
            className={cn(
              'flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-300 ease-out',
              mode === 'audio'
                ? 'gradient-primary text-white'
                : 'px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium transition-colors'
            )}>
            <Music className="w-5 h-5" />
            Audio Only
          </button>

        </div>

        {/* MODE DEPENDENT SECTION */}
        <div className="transition-all duration-300 ease-in-out">
          {mode === 'video' ? (
            <>
              <label className="text-sm text-muted-foreground mb-2 block">
                Quality
              </label>

              <Select
                value={quality}
                onValueChange={(value) => setQuality(value as VideoQuality)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="360p">360p</SelectItem>
                  <SelectItem value="480p">480p SD</SelectItem>
                  <SelectItem value="720p">720p HD</SelectItem>
                  <SelectItem value="1080p">1080p FHD</SelectItem>
                  <SelectItem value="1440p">1440p 2K</SelectItem>
                  <SelectItem value="2160p">2160p 4K</SelectItem>
                </SelectContent>
              </Select>
            </>
          ) : (
            <>
              <label className="text-sm text-muted-foreground mb-2 block">
                Format
              </label>

              <Select
                value={format}
                onValueChange={(value) => setFormat(value as AudioFormat)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="mp3">MP3</SelectItem>
                  <SelectItem value="m4a">M4A</SelectItem>
                  <SelectItem value="wav">WAV</SelectItem>
                  <SelectItem value="opus">OPUS</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        {/* Estimated file size */}
        {currentMetadata && (
          <div
            className="
              flex items-center justify-between text-sm
              animate-in fade-in slide-in-from-top-1
              duration-300
            "
          >
            <span className="text-muted-foreground">Estimated size:</span>
            <span className="font-medium flex items-center gap-2">
              {isCalculatingSize && <Loader2 className="h-3 w-3 animate-spin" />}
              {estimatedSize}
            </span>
          </div>
        )}

        {/* Download Subtitles */}
        {mode === 'video' && (
          <div
            className="
              flex items-center gap-3
              animate-in fade-in slide-in-from-top-2
              duration-300
            "
          >
            <Switch checked={downloadSubs} onCheckedChange={setDownloadSubs} />
            <span className="text-sm">Download Subtitles</span>
          </div>
        )}

      </div>

      {/* Playlist Options */}
      {currentMetadata?.isPlaylist && (
        <div className="card-elevated p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <ListVideo className="w-4 h-4" />
            Playlist Options ({currentMetadata.videoCount} videos)
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {(['all', 'range', 'manual'] as PlaylistMode[]).map((m) => {
              const isActive = playlistMode === m;

              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setPlaylistMode(m);
                    if (m === 'manual') setShowPlaylistSelector(true);
                  }}
                  className={cn(
                    // base (shadcn-like)
                    'py-2 rounded-lg text-sm font-medium capitalize transition-all duration-300 ease-out active:scale-[0.98]',

                    // inactive (Video + Audio / Audio Only style)
                    !isActive &&
                    'bg-primary/10 text-primary hover:bg-primary/20',

                    // active
                    isActive && 'bg-primary text-white shadow-md shadow-primary/30 '
                  )}
                >
                  {m === 'manual' && selectedCount > 0
                    ? `Manual (${selectedCount})`
                    : m}
                </button>
              );
            })}
          </div>

          {playlistMode === 'range' && (
            <div
              className="
                flex gap-2 items-center
                mt-3
                animate-in fade-in slide-in-from-top-2
                duration-300
              "
            >
              <Input
                type="number"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                min={1}
                max={currentMetadata.videoCount}
                className="w-24 text-center"
              />

              <span className="text-muted-foreground">to</span>

              <Input
                type="number"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                min={1}
                max={currentMetadata.videoCount}
                className="w-24 text-center"
              />
            </div>
          )}
        </div>
      )}

      {/* Naming Options */}
      <NamingOptions
        contentType={contentType}
        mode={mode}
        currentTemplate={currentNamingTemplate}
        onTemplateChange={setCurrentNamingTemplate}
      />

      {/* Start Download Button */}
      {currentMetadata && (
        <StartDownloadButton onClick={handleStartDownload} />
      )}



      {/* Playlist Selector Modal */}
      {showPlaylistSelector && currentMetadata?.videos && (
        <PlaylistSelector
          videos={selectedVideos.length > 0 ? selectedVideos : currentMetadata.videos}
          onConfirm={(videos) => { setSelectedVideos(videos); setShowPlaylistSelector(false); }}
          onClose={() => setShowPlaylistSelector(false)}
        />
      )}

    </div>
  );
}
