import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { JobCard } from '@/components/JobCard';
import { pauseDownload, resumeDownload } from '@/lib/api';
import { Download, Inbox } from 'lucide-react';

export default function ActiveJobs() {
  const { jobs, updateJob, removeJob, addToHistory } = useAppStore();
  const simulationRef = useRef<Map<string, { downloadedMB: number; speedMBps: number }>>(new Map());

  // Realistic download progress simulation
  useEffect(() => {
    const interval = setInterval(() => {
      jobs.forEach((job) => {
        if (job.status === 'downloading') {
          // Get or initialize simulation state for this job
          let simState = simulationRef.current.get(job.id);
          if (!simState) {
            simState = {
              downloadedMB: 0,
              speedMBps: 1.5 + Math.random() * 2.5, // 1.5-4 MB/s initial speed
            };
            simulationRef.current.set(job.id, simState);
          }

          const totalSizeMB = parseFloat(job.fileSize?.replace(/[^\d.]/g, '') || '100');
          
          // Vary speed slightly for realism (±0.3 MB/s)
          simState.speedMBps = Math.max(0.5, Math.min(5, simState.speedMBps + (Math.random() - 0.5) * 0.6));
          
          // Download chunk (speed per second)
          const downloadChunk = simState.speedMBps;
          simState.downloadedMB = Math.min(totalSizeMB, simState.downloadedMB + downloadChunk);
          
          const progress = Math.min(100, (simState.downloadedMB / totalSizeMB) * 100);
          const remainingMB = totalSizeMB - simState.downloadedMB;
          const etaSeconds = Math.ceil(remainingMB / simState.speedMBps);
          
          // Format ETA
          const etaMinutes = Math.floor(etaSeconds / 60);
          const etaSecs = etaSeconds % 60;
          const etaStr = etaMinutes > 0 
            ? `${etaMinutes}:${etaSecs.toString().padStart(2, '0')}`
            : `0:${etaSecs.toString().padStart(2, '0')}`;

          // Check if completed
          if (progress >= 100) {
            // Clean up simulation state
            simulationRef.current.delete(job.id);
            
            updateJob(job.id, {
              progress: 100,
              downloadedSize: job.fileSize,
              status: 'completed',
              speed: undefined,
              eta: undefined,
              completedAt: new Date(),
            });

            // Add to history
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

            // Start the next queued job
            const queuedJobs = jobs.filter(j => j.status === 'queued');
            if (queuedJobs.length > 0) {
              updateJob(queuedJobs[0].id, { status: 'downloading' });
            }
          } else {
            updateJob(job.id, {
              progress: Math.round(progress),
              downloadedSize: `${simState.downloadedMB.toFixed(1)} MB`,
              speed: `${simState.speedMBps.toFixed(1)} MB/s`,
              eta: etaStr,
            });
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [jobs, updateJob, addToHistory]);

  // Clean up simulation state for removed/completed jobs
  useEffect(() => {
    const activeJobIds = new Set(jobs.filter(j => j.status === 'downloading').map(j => j.id));
    simulationRef.current.forEach((_, jobId) => {
      if (!activeJobIds.has(jobId)) {
        simulationRef.current.delete(jobId);
      }
    });
  }, [jobs]);

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
                  resumeDownload(job.id).catch(err => console.error('Resume error:', err));
                  updateJob(job.id, { status: 'downloading' });
                }}
                onCancel={() => {
                  simulationRef.current.delete(job.id);
                  updateJob(job.id, { status: 'canceled' });
                }}
                onRemove={() => {
                  simulationRef.current.delete(job.id);
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
