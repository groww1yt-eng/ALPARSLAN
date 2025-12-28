import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { fetchMetadata, downloadVideo as apiDownloadVideo, getDownloadProgress, pauseDownload, resumeDownload } from '@/lib/api';
import { isValidYouTubeUrl, calculateFileSize, formatFileSize } from '@/lib/demoData';
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

  useEffect(() => {
    if (currentMetadata?.isPlaylist && currentMetadata.videoCount) {
      setRangeStart('1');
      setRangeEnd(String(currentMetadata.videoCount));
    }
  }, [currentMetadata]);

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
      const metadata = await fetchMetadata(url);
      setCurrentMetadata(metadata);

      // Initialize selected videos empty for playlists (user must select)
      if (metadata?.videos) {
        setSelectedVideos(metadata.videos); // Already set to selected: false
      }

      addNotification({ type: 'success', title: 'Fetched!', message: metadata?.title || 'Video info loaded' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch metadata';
      addNotification({ type: 'error', title: 'Error', message });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFetchMetadata();
    }
  };

  // Calculate file size based on mode, quality/format, and duration
  const getCalculatedFileSize = (): string => {
    if (!currentMetadata) return '0 MB';

    if (currentMetadata.isPlaylist) {
      // For playlists, calculate based on selected videos or all videos
      const videosToCalculate = playlistMode === 'manual'
        ? selectedVideos.filter(v => v.selected)
        : playlistMode === 'range'
          ? (currentMetadata.videos || []).slice(parseInt(rangeStart) - 1, parseInt(rangeEnd))
          : currentMetadata.videos || [];

      // Estimate average duration of 8 minutes per video if no specific durations
      const totalDuration = videosToCalculate.length * 480; // 8 min avg
      const sizeMB = calculateFileSize(totalDuration, mode, quality, format);
      return formatFileSize(sizeMB);
    }

    // Single video
    const sizeMB = calculateFileSize(currentMetadata.durationSeconds, mode, quality, format);
    return formatFileSize(sizeMB);
  };

  const handleStartDownload = async () => {
    if (!currentMetadata) return;

    const processDownload = async (videoId: string, title: string, videoUrl: string) => {
      const jobId = crypto.randomUUID();


      const newJob = {
        id: jobId,
        videoId,
        title,
        channel: currentMetadata.channel,
        thumbnail: currentMetadata.thumbnail,
        mode,
        quality: mode === 'video' ? quality : undefined,
        format: mode === 'audio' ? format : undefined,
        status: 'downloading' as const,
        progress: 0,
        speed: '0 MB/s',
        eta: 'Calculating...',
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
        // Call the actual download API with jobId
        const downloadPromise = apiDownloadVideo(
          videoUrl,
          videoId,
          jobId,
          settings.outputFolder,
          mode,
          quality,
          format
        );

        // Start polling for progress
        let progressInterval: NodeJS.Timeout | null = null;
        let lastFileSize = 'Calculating...'; // Keep track of the most recent file size

        const startProgressPolling = () => {
          progressInterval = setInterval(async () => {
            try {
              const progress = await getDownloadProgress(jobId);

              // Calculate file size - use total bytes if available
              let displayFileSize = lastFileSize;
              if (progress.totalBytes > 0) {
                displayFileSize = `${(progress.totalBytes / (1024 * 1024)).toFixed(2)} MB`;
                lastFileSize = displayFileSize; // Remember the actual size
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
                progress: isNaN(progress.percentage) ? 0 : Math.min(100, progress.percentage),
                fileSize: displayFileSize,
                downloadedSize,
                speed,
                eta,
              });

              // Stop polling when completed or failed
              if (progress.status === 'completed' || progress.status === 'failed') {
                if (progressInterval) {
                  clearInterval(progressInterval);
                }
              }
            } catch (error) {
              console.error('Error getting progress:', error);
            }
          }, 500); // Poll every 500ms
        };

        startProgressPolling();

        const result = await downloadPromise;

        if (progressInterval) {
          clearInterval(progressInterval);
        }

        if (result.success) {
          // Check if this was a pause/cancel - don't mark as completed!
          if (result.status === 'paused' || result.status === 'canceled') {
            // Don't update status - it was already set by the pause/cancel handler
            console.log(`Download ${jobId} was ${result.status}, not marking as completed`);
          } else {
            // Actual completion - update job status to completed with actual file size
            updateJob(jobId, {
              status: 'completed' as const,
              progress: 100,
              fileSize: result.fileSize,
              downloadedSize: result.fileSize,
              eta: '0:00',
              speed: '0 MB/s',
              completedAt: new Date(),
            });

            // Add to history
            addToHistory({
              id: crypto.randomUUID(),
              title,
              channel: currentMetadata.channel,
              thumbnail: currentMetadata.thumbnail,
              mode,
              quality: mode === 'video' ? quality : undefined,
              format: mode === 'audio' ? format : undefined,
              fileSize: result.fileSize,
              filePath: result.filePath,
              completedAt: new Date(),
            });

            addNotification({
              type: 'success',
              title: 'Download Complete',
              message: `${title} (${result.fileSize}) saved`,
            });
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        // Update job status to failed
        updateJob(jobId, {
          status: 'failed' as const,
          error: message,
        });

        addNotification({
          type: 'error',
          title: 'Download Failed',
          message: `${title}: ${message}`,
        });
      }
    };

    if (currentMetadata.isPlaylist && currentMetadata.videos) {
      // Determine which videos to download based on playlist mode
      let videosToDownload: PlaylistVideo[] = [];

      if (playlistMode === 'all') {
        videosToDownload = currentMetadata.videos;
      } else if (playlistMode === 'range') {
        const start = Math.max(1, parseInt(rangeStart)) - 1;
        const end = Math.min(currentMetadata.videos.length, parseInt(rangeEnd));
        videosToDownload = currentMetadata.videos.slice(start, end);
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
        const playlistUrl = url.split('&')[0]; // Remove query params if any
        await processDownload(video.id, video.title, playlistUrl);
      }
    } else {
      // Single video download
      await processDownload(currentMetadata.id, currentMetadata.title, url);
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
            <span className="font-medium">{getCalculatedFileSize()}</span>
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
