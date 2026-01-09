import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NotificationToast } from './NotificationToast';

/**
 * Layout Component
 * Defines the main application structure (Sidebar + Header + Page Content).
 */
export function Layout() {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <NotificationToast />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
