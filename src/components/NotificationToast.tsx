import { useEffect, useRef, useState } from 'react';
import { useUIStore } from '@/store/useUIStore';
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


interface ToastItemProps {
  notification: any;
  removeNotification: (id: string) => void;
}

/**
 * ToastItem Component
 * 
 * A single toast notification unit with gesture support.
 * 
 * Interactions:
 * - Swipe-to-dismiss: Detects touch gestures (up, left, right) to dismiss the toast.
 * - Auto-dismiss: Handled by the parent `NotificationToast` component.
 * - Drag Animation: Uses inline styles for performance-critical drag tracking.
 */
function ToastItem({ notification, removeNotification }: ToastItemProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const Icon = iconMap[notification.type as keyof typeof iconMap];

  // Logic to track touch movement delta
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDismissing) return;
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current || isDismissing) return;

    const deltaX = e.touches[0].clientX - touchStart.current.x;
    const deltaY = e.touches[0].clientY - touchStart.current.y;

    // Only allow swiping up for vertical dismiss (prevent interfering with scroll if any)
    const clampedDeltaY = Math.min(0, deltaY);

    setOffset({ x: deltaX, y: clampedDeltaY });
  };

  const handleTouchEnd = () => {
    if (!touchStart.current || isDismissing) {
      setIsDragging(false);
      return;
    }

    const threshold = 80;
    const { x: deltaX, y: deltaY } = offset;

    const isSwipeRight = deltaX > threshold;
    const isSwipeLeft = deltaX < -threshold;
    const isSwipeUp = deltaY < -threshold;

    // Detect if swipe crossed the threshold to trigger dismiss
    if (isSwipeRight || isSwipeLeft || isSwipeUp) {
      setIsDismissing(true);
      // Animate out further in the swipe direction
      if (isSwipeRight) setOffset({ x: 500, y: deltaY });
      else if (isSwipeLeft) setOffset({ x: -500, y: deltaY });
      else if (isSwipeUp) setOffset({ x: deltaX, y: -500 });

      setTimeout(() => {
        removeNotification(notification.id);
      }, 200);
    } else {
      // Snap back if swipe wasn't far enough
      setOffset({ x: 0, y: 0 });
    }

    touchStart.current = null;
    setIsDragging(false);
  };

  const opacity = Math.max(0, 1 - (Math.abs(offset.x) + Math.abs(offset.y)) / 300);

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl border backdrop-blur-lg animate-slide-in-right pointer-events-auto mx-auto w-full touch-pan-y transition-all duration-200',
        colorMap[notification.type as keyof typeof colorMap],
        isDragging ? 'duration-0 scale-[1.02] shadow-xl' : 'scale-100',
        isDismissing && 'duration-300 opacity-0 pointer-events-none'
      )}
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        opacity: isDismissing ? 0 : opacity,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{notification.title}</p>
        <p className="text-xs opacity-80 truncate">{notification.message}</p>
      </div>
      <button
        onClick={() => {
          setIsDismissing(true);
          setTimeout(() => removeNotification(notification.id), 200);
        }}
        className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * NotificationToast Component
 * 
 * Fixed overlay container for displaying toast notifications.
 * Manages the lifecycle (timers) of notifications using the global UI store.
 */
export function NotificationToast() {
  const { notifications, removeNotification } = useUIStore();
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Manage auto-dismiss timers
  useEffect(() => {
    const timers = timersRef.current;

    notifications.forEach((notification) => {
      if (timers.has(notification.id)) return;

      const duration = notification.duration ?? 5000;

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
        {notifications.map((notification) => (
          <ToastItem
            key={notification.id}
            notification={notification}
            removeNotification={removeNotification}
          />
        ))}
      </div>
    </div>
  );
}


