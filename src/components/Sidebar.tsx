import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ConfirmModal } from '@/components/ConfirmModal';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  X, 
  LayoutDashboard, 
  Download, 
  History, 
  Settings,
  RotateCcw,
  Video,
  Music,
  Folder
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, settings, resetSettings, addNotification } = useAppStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/active', label: 'Active Jobs', icon: Download },
    { path: '/history', label: 'History', icon: History },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleResetDefaults = () => {
    resetSettings();
    setSidebarOpen(false);
  };

  const confirmResetDefaults = () => {
    resetSettings();

    addNotification({
      type: 'success',
      title: 'Settings Reset',
      message: 'All settings have been reset to default.',
    });

    setSidebarOpen(false);
    setShowResetConfirm(false);
  };

  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-72 bg-sidebar z-50 transform transition-transform duration-300 ease-out flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:z-auto'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-sidebar-foreground">ALP</h1>
              <p className="text-xs text-sidebar-foreground/60">Video Downloader</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-sidebar-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                location.pathname === path
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Current Defaults */}
        <div className="p-4 border-t border-sidebar-border">
          <h3 className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-3">
            Current Defaults
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-sidebar-foreground/70">
              {settings.defaultMode === 'video' ? (
                <Video className="w-4 h-4 text-primary" />
              ) : (
                <Music className="w-4 h-4 text-primary" />
              )}
              <span className="capitalize">{settings.defaultMode}</span>
              <span className="text-sidebar-foreground/40">•</span>
              <span>{settings.defaultMode === 'video' ? settings.defaultQuality : settings.defaultFormat.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2 text-sidebar-foreground/70">
              <Folder className="w-4 h-4 text-primary" />
              <span className="truncate text-xs">{settings.outputFolder}</span>
            </div>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-sidebar-accent hover:bg-sidebar-accent/80 rounded-lg text-sm text-sidebar-foreground/70 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Defaults
          </button>
        </div>

        <ConfirmModal
          open={showResetConfirm}
          onCancel={() => setShowResetConfirm(false)}
          onConfirm={confirmResetDefaults}
        />

      </aside>
    </>
  );
}
