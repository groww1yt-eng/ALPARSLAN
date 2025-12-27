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
  success: 'bg-success/10 border-success/30 text-success',
  error: 'bg-destructive/10 border-destructive/30 text-destructive',
  warning: 'bg-warning/10 border-warning/30 text-warning',
  info: 'bg-info/10 border-info/30 text-info',
};

export function NotificationToast() {
  const { notifications, removeNotification } = useAppStore();

  useEffect(() => {
    notifications.forEach((notification) => {
      const duration = notification.duration || 4000;
      const timer = setTimeout(() => {
        removeNotification(notification.id);
      }, duration);
      return () => clearTimeout(timer);
    });
  }, [notifications, removeNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 space-y-2 pointer-events-none">
      {notifications.map((notification) => {
        const Icon = iconMap[notification.type];
        return (
          <div
            key={notification.id}
            className={cn(
              'mx-auto max-w-md flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-lg animate-slide-in-right pointer-events-auto',
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
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
