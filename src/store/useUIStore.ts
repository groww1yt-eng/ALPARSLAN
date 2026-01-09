import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification } from '@/types';

type Theme = 'dark' | 'light';

// Store for volatile UI state and some persisted UI preferences (like theme)
interface UIState {
    theme: Theme;
    setTheme: (theme: Theme) => void;

    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;

    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: string) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            theme: 'dark',
            setTheme: (theme) => set({ theme }),

            sidebarOpen: false,
            setSidebarOpen: (open) => set({ sidebarOpen: open }),

            notifications: [],
            addNotification: (notification) =>
                set((state) => ({
                    notifications: [
                        ...state.notifications,
                        { ...notification, id: crypto.randomUUID() },
                    ],
                })),
            removeNotification: (id) =>
                set((state) => ({
                    notifications: state.notifications.filter((n) => n.id !== id),
                })),
        }),
        {
            name: 'alp-ui-storage',
            // Only persist specific fields (theme), do not persist notifications or sidebar state
            partialize: (state) => ({ theme: state.theme } as any),
        }
    )
);
