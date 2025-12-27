import type { DownloadJob } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { 
  Play, 
  Pause, 
  X, 
  RotateCcw, 
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import ScrollingTitle from './ScrollingTitle';

interface JobCardProps {
  job: DownloadJob;
  onResume?: () => void;
  onPause?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  onRemove?: () => void;
}

const statusConfig = {
  queued: {
    icon: Clock,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    label: 'Queued',
  },
  downloading: {
    icon: Play,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    label: 'Downloading',
  },
  paused: {
    icon: Pause,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    label: 'Paused',
  },
  waiting: {
    icon: WifiOff,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    label: 'Waiting for Network',
  },
  completed: {
    icon: CheckCircle,
    color: 'text-success',
    bgColor: 'bg-success/10',
    label: 'Completed',
  },
  failed: {
    icon: AlertCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    label: 'Failed',
  },
  canceled: {
    icon: X,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    label: 'Canceled',
  },
};

export function JobCard({ job, onResume, onPause, onCancel, onRetry, onRemove }: JobCardProps) {
  const config = statusConfig[job.status];
  const StatusIcon = config.icon;

  return (
    <div className="card-elevated p-4 space-y-3">
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="relative w-24 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          <img
            src={job.thumbnail}
            alt={job.title}
            className="w-full h-full object-cover"
          />
          {job.status === 'completed' && (
            <div className="absolute inset-0 bg-success/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
          )}
          {job.status === 'canceled' && (
            <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
              <X className="w-6 h-6 text-destructive" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <ScrollingTitle className="font-medium text-sm" title={job.title}>
            {job.title}
          </ScrollingTitle>
          <p className="text-xs text-muted-foreground truncate">{job.channel}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full', config.bgColor, config.color)}>
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {job.mode} • {job.mode === 'video' ? job.quality : job.format?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      {(job.status === 'downloading' || job.status === 'paused' || job.status === 'queued') && (
        <div className="space-y-2">
          <div className="relative">
            <Progress 
              value={job.progress} 
              className={cn(
                'h-2',
                job.status === 'paused' && 'opacity-50'
              )}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{job.downloadedSize || '0 MB'} / {job.fileSize || 'Unknown'}</span>
            <span className="flex items-center gap-2">
              {job.speed && <span>{job.speed}</span>}
              {job.eta && <span>ETA: {job.eta}</span>}
              <span className="font-medium text-foreground">{job.progress}%</span>
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {job.status === 'failed' && job.error && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{job.error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {job.status === 'downloading' && (
          <button
            onClick={onPause}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-warning/10 text-warning rounded-lg hover:bg-warning/20 transition-colors"
          >
            <Pause className="w-4 h-4" />
            <span className="text-sm font-medium">Pause</span>
          </button>
        )}
        
        {(job.status === 'paused' || job.status === 'waiting') && (
          <button
            onClick={onResume}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span className="text-sm font-medium">Resume</span>
          </button>
        )}

        {job.status === 'failed' && (
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm font-medium">Retry</span>
          </button>
        )}

        {(job.status === 'downloading' || job.status === 'paused' || job.status === 'queued' || job.status === 'waiting') && (
          <button
            onClick={onCancel}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="text-sm font-medium">Cancel</span>
          </button>
        )}

        {(job.status === 'completed' || job.status === 'failed' || job.status === 'canceled') && (
          <button
            onClick={onRemove}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-medium">Remove</span>
          </button>
        )}
      </div>
    </div>
  );
}
