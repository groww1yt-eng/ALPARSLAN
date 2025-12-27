import { useEffect } from 'react';
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
  success:  'bg-success/10 border-success/30 text-success',
  error: 'bg-destructive/10 border-destructive/30 text-destructive',
  warning: 'bg-warning/10 border-warning/30 text-warning',
  info: 'bg-info/10 border-info/30 text-info',
};

export function NotificationToast() {
  const { notifications, removeNotification } = useAppStore();

  useEffect(() => {
    const timers = new Map<string, NodeJS.Timeout>();

    notifications.forEach((notification) => {
      if (timers.has(notification.id)) {
        clearTimeout(timers.get(notification.id));
      }

      const duration = notification.duration || 4000;
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
      className="fixed top-0 left-0 right-0 z-[9999] p-3 flex flex-col items-center"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div className="w-full max-w-sm flex flex-col gap-2">
        {notifications.map((notification) => {
          const Icon = iconMap[notification.type];
          return (
            <div
              key={notification.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border bg-background/90 animate-slide-in-right',
                colorMap[notification.type]
              )}
            >
              <Icon className="w-5 h-5" />
              <div className="flex-1">
                <p className="font-medium text-sm">{notification.title}</p>
                <p className="text-xs opacity-80">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="p-1 rounded-lg"
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
