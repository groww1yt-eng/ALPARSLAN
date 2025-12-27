import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { JobCard } from '@/components/JobCard';
import { pauseDownload, resumeDownload, cancelDownload } from '@/lib/api';
import { Download, Inbox } from 'lucide-react';

export default function ActiveJobs() {
  const { jobs, updateJob, removeJob, addToHistory } = useAppStore();

  // Poll for progress for all active jobs
  useEffect(() => {
    const activeJobs = jobs.filter(j => ['downloading', 'queued', 'waiting'].includes(j.status));
    if (activeJobs.length === 0) return;

    const interval = setInterval(async () => {
      for (const job of activeJobs) {
        if (job.status !== 'downloading') continue;

        try {
          const progress = await fetch(`/api/download/progress/${job.id}`).then(res => res.json());

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
          // Convert bytes to MB
          const totalMB = (progress.totalBytes / (1024 * 1024));
          const downloadedMB = (progress.downloadedBytes / (1024 * 1024));
          const speedMBps = (progress.speed / (1024 * 1024));

          updateJob(job.id, {
            progress: Math.min(100, Math.round(progress.percentage || 0)),
            downloadedSize: `${downloadedMB.toFixed(1)} MB / ${totalMB.toFixed(1)} MB`,
            speed: `${speedMBps.toFixed(1)} MB/s`,
            eta: formatEta(progress.eta),
            fileSize: `${totalMB.toFixed(1)} MB`
          });

        } catch (err) {
          console.error('Error polling progress:', err);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [jobs, updateJob, addToHistory]);

  // Helper for ETA formatting
  const formatEta = (seconds: number) => {
    if (!seconds || seconds === Infinity) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const activeJobs = jobs.filter(j => ['downloading', 'paused', 'queued', 'waiting'].includes(j.status));
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
                onPause={() => {
                  pauseDownload(job.id).catch(err => console.error('Pause error:', err));
                  updateJob(job.id, { status: 'paused' });
                }}
                onResume={() => {
                  resumeDownload(job.id).catch(err => {
                    console.error('Resume error:', err);
                    // If resume fails, maybe set back to paused? 
                    // But for now just log it. 
                  });
                  updateJob(job.id, { status: 'downloading' });
                }}
                onCancel={() => {
                  cancelDownload(job.id).catch(err => console.error('Cancel error:', err));
                  updateJob(job.id, { status: 'canceled' });
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
