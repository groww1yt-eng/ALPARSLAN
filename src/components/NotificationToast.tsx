import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/store/useAppStore';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: 'bg-success/10 border-success/30 text-success',
  error: 'bg-destructive/10 border-destructive/30 text-destructive',
  warning: 'bg-warning/10 border-warning/30 text-warning',
  info: 'bg-info/10 border-info/30 text-info',
};

export function NotificationToast() {
  const { notifications, removeNotification } = useAppStore();
  const timers = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    notifications.forEach((n) => {
      if (timers.current.has(n.id)) return;

      const id = window.setTimeout(() => {
        removeNotification(n.id);
        timers.current.delete(n.id);
      }, n.duration ?? 4000);

      timers.current.set(n.id, id);
    });

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
    };
  }, [notifications, removeNotification]);

  if (!notifications.length) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed top-0 inset-x-0 z-[9999] p-3 flex flex-col items-center pointer-events-none">
      <div className="w-full max-w-md space-y-2">
        {notifications.map((n) => {
          const Icon = iconMap[n.type];
          return (
            <div
              key={n.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-lg pointer-events-auto',
                colorMap[n.type]
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs opacity-80">{n.message}</p>
              </div>
              <button
                onClick={() => removeNotification(n.id)}
                className="p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
}
