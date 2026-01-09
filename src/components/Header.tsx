import { useUIStore } from '@/store/useUIStore';
import { useDownloadsStore } from '@/store/useDownloadsStore';
import { Menu, Download } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/active': 'Active Jobs',
  '/history': 'History',
  '/settings': 'Settings',
  '/compatibility': 'Compatibility',
};

/**
 * Header Component
 * Displays the current page title and global actions (Sidebar toggle, Active jobs badge, Theme toggle).
 */
export function Header() {
  const { setSidebarOpen } = useUIStore();
  const { jobs } = useDownloadsStore();
  const location = useLocation();

  // Calculate active downloads (downloading or queued state)
  const activeJobsCount = jobs.filter(j => j.status === 'downloading' || j.status === 'queued').length;

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border transition-colors duration-300">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">{pageTitles[location.pathname] || 'Dashboard'}</h1>
        </div>

        <div className="flex items-center gap-3">
          {activeJobsCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
              <Download className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">{activeJobsCount}</span>
            </div>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
