import { useEffect } from 'react';
import { useDownloadsStore } from '@/store/useDownloadsStore';
import { JobCard } from '@/components/JobCard';
import { pauseDownload, resumeDownload, cancelDownload, getDownloadProgress } from '@/lib/api';
import { handleAppError } from '@/lib/errorHandler';
import { Download, Inbox } from 'lucide-react';

/**
 * ActiveJobs Component
 * 
 * Displays and manages currently active download jobs.
 * 
 * Key features:
 * - Polls for progress updates provided by the backend for all active jobs
 * - Updates the Zustand store with real-time progress, speed, and ETA
 * - Handles job lifecycle actions: Pause, Resume, Cancel
 * - Moves completed jobs to history and handles failure states
 */
export default function ActiveJobs() {
  const { jobs, updateJob, removeJob, addToHistory } = useDownloadsStore();

  // Poll for progress for all active jobs
  useEffect(() => {
    // Filter jobs that actually need polling (exclude completed/failed/canceled)
    const activeJobs = jobs.filter(j => ['downloading', 'converting', 'queued', 'waiting'].includes(j.status));
    if (activeJobs.length === 0) return;

    // Polling interval (1 second)
    const interval = setInterval(async () => {
      try {
        for (const job of activeJobs) {
          // Only poll for states where backend work is happening
          if (job.status !== 'downloading' && job.status !== 'converting') continue;

          try {
            const progress = await getDownloadProgress(job.id);

            if (progress.error) continue;

            // Handle Completion
            if (progress.status === 'completed') {
              updateJob(job.id, {
                progress: 100,
                downloadedSize: job.fileSize,
                status: 'completed',
                speed: undefined,
                eta: undefined,
                completedAt: new Date(),
              });

              // Add to history persistence
              addToHistory({
                id: crypto.randomUUID(),
                title: job.title,
                channel: job.channel,
                thumbnail: job.thumbnail,
                mode: job.mode,
                quality: job.quality,
                format: job.format,
                fileSize: job.fileSize || '0 MB',
                filePath: `/storage/emulated/0/ALP/${job.title}.${job.mode === 'video' ? 'mp4' : job.format || 'mp3'}`,
                completedAt: new Date(),
              });
              continue;
            }

            // Handle Failure
            if (progress.status === 'failed') {
              updateJob(job.id, {
                status: 'failed',
                error: progress.error || 'Download failed'
              });
              continue;
            }

            // Handle Active Progress
            // Convert bytes to MB for UI display
            const totalMB = (progress.totalBytes / (1024 * 1024));
            const downloadedMB = (progress.downloadedBytes / (1024 * 1024));
            const speedMBps = (progress.speed / (1024 * 1024));

            updateJob(job.id, {
              progress: Math.min(100, Math.round(progress.percentage || 0)),
              downloadedSize: `${downloadedMB.toFixed(1)} MB`, // Only downloaded amount
              speed: `${speedMBps.toFixed(1)} MB/s`,
              eta: formatEta(progress.eta),
              fileSize: `${totalMB.toFixed(1)} MB`
            });
          } catch (error) {
            // Silently handle polling errors to avoid spamming the user
            handleAppError(error, { title: 'Error', defaultMessage: 'Error polling progress', notify: false, logLabel: 'Error polling progress:' });
          }
        }
      } catch (error) {
        handleAppError(error, { title: 'Error', defaultMessage: 'Error polling progress', notify: false, logLabel: 'Error polling progress:' });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [jobs, updateJob, addToHistory]);

  // Helper for ETA formatting (Seconds -> MM:SS)
  const formatEta = (seconds: number) => {
    if (!seconds || seconds === Infinity) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter lists for display active vs recent
  const activeJobs = jobs.filter(j => ['downloading', 'converting', 'paused', 'queued', 'waiting'].includes(j.status));
  const recentJobs = jobs.filter(j => ['completed', 'failed', 'canceled'].includes(j.status)).slice(0, 5);

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      {/* Active Downloads */}
      <section>
        <h2 className="flex items-center gap-2 font-semibold mb-3">
          <Download className="w-5 h-5 text-primary" /> Active Downloads ({activeJobs.length})
        </h2>
        {activeJobs.length === 0 ? (
          <div className="card-elevated p-8 text-center">
            <Inbox className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No active downloads</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onPause={async () => {
                  const previousStatus = job.status;
                  updateJob(job.id, { status: 'paused' });
                  try {
                    await pauseDownload(job.id);
                  } catch (error) {
                    handleAppError(error, { title: 'Pause Failed', defaultMessage: 'Failed to pause download' });
                    updateJob(job.id, { status: previousStatus });
                  }
                }}
                onResume={async () => {
                  const previousStatus = job.status;
                  updateJob(job.id, { status: 'downloading' });
                  try {
                    await resumeDownload(job.id);
                  } catch (error) {
                    handleAppError(error, { title: 'Resume Failed', defaultMessage: 'Failed to resume download' });
                    updateJob(job.id, { status: previousStatus });
                  }
                }}
                onCancel={async () => {
                  const previousStatus = job.status;
                  updateJob(job.id, { status: 'canceled' });
                  try {
                    await cancelDownload(job.id);
                  } catch (error) {
                    handleAppError(error, { title: 'Cancel Failed', defaultMessage: 'Failed to cancel download' });
                    updateJob(job.id, { status: previousStatus });
                  }
                }}
                onRemove={() => {
                  removeJob(job.id);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recent Jobs */}
      {recentJobs.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3">Recent</h2>
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onRetry={() => updateJob(job.id, { status: 'downloading', progress: 0, downloadedSize: '0 MB' })}
                onRemove={() => removeJob(job.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
