import { useEffect, useRef } from 'react';
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
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const timers = timersRef.current;

    notifications.forEach((notification) => {
      if (timers.has(notification.id)) return;

      const duration = notification.duration ?? 4000;

      const timer = setTimeout(() => {
        removeNotification(notification.id);
        timers.delete(notification.id);
      }, duration);

      timers.set(notification.id, timer);
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, [notifications, removeNotification]);


  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 p-3 sm:p-4 space-y-2 pointer-events-none flex flex-col items-center"
      style={{
        // Ensure it's above everything on mobile
        WebkitTransform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
      }}
    >
      <div className="w-full max-w-sm sm:max-w-md flex flex-col gap-2">
        {notifications.map((notification) => {
          const Icon = iconMap[notification.type];
          return (
            <div
              key={notification.id}
              className={cn(
                'flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl border backdrop-blur-lg animate-slide-in-right pointer-events-auto mx-auto w-full',
                colorMap[notification.type]
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{notification.title}</p>
                <p className="text-xs opacity-80 truncate">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
