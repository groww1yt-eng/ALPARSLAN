import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppSettings,
  DownloadJob,
  HistoryItem,
  Notification,
  VideoMetadata
} from '@/types';

type Theme = 'dark' | 'light';

interface AppState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;

  // Jobs
  jobs: DownloadJob[];
  addJob: (job: DownloadJob) => void;
  updateJob: (id: string, updates: Partial<DownloadJob>) => void;
  removeJob: (id: string) => void;
  clearCompletedJobs: () => void;

  // History
  history: HistoryItem[];
  addToHistory: (item: HistoryItem) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;

  // Current metadata (for dashboard)
  currentMetadata: VideoMetadata | null;
  setCurrentMetadata: (metadata: VideoMetadata | null) => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const getDefaultOutputFolder = (): string => {
  // Detect Android
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (isAndroid) {
    return '/storage/emulated/0/ALP/';
  }
  return 'C:\\Users\\ariya\\Downloads\\ALP';
};

const defaultSettings: AppSettings = {
  outputFolder: getDefaultOutputFolder(),
  defaultMode: 'video',
  defaultQuality: '1080p',
  defaultFormat: 'mp3',
  downloadSubtitles: false,
  reEncode: false,
  reEncodeFormat: 'mp4',
  filenameTemplate: '<title>',
  perChannelFolders: false,
  minimalConsole: true,
  namingTemplates: {
    single: {
      video: '<title> - <quality>',
      audio: '<title>',
    },
    playlist: {
      video: '<index> - <title> - <quality>',
      audio: '<index> - <title>',
    },
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      settings: defaultSettings,
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
      resetSettings: () => set({ settings: defaultSettings }),

      jobs: [],
      addJob: (job) =>
        set((state) => ({
          jobs: [job, ...state.jobs],
        })),
      updateJob: (id, updates) =>
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id ? { ...job, ...updates } : job
          ),
        })),
      removeJob: (id) =>
        set((state) => ({
          jobs: state.jobs.filter((job) => job.id !== id),
        })),
      clearCompletedJobs: () =>
        set((state) => ({
          jobs: state.jobs.filter((job) => job.status !== 'completed'),
        })),

      history: [],
      addToHistory: (item) =>
        set((state) => ({
          history: [item, ...state.history],
        })),
      removeFromHistory: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),
      clearHistory: () => set({ history: [] }),

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

      currentMetadata: null,
      setCurrentMetadata: (metadata) => set({ currentMetadata: metadata }),

      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'alp-downloader-storage',
      partialize: (state) => ({
        theme: state.theme,
        settings: state.settings,
        history: state.history,
        jobs: state.jobs,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset any 'active' jobs to paused on reload
          state.jobs = state.jobs.map((job) => {
            if (['downloading', 'queued', 'waiting'].includes(job.status)) {
              return { ...job, status: 'paused' };
            }
            return job;
          });
        }
      },
      migrate: (persistedState: any, version: number) => {
        // Migrate old data to new structure
        if (persistedState && persistedState.settings && !persistedState.settings.namingTemplates) {
          persistedState.settings.namingTemplates = defaultSettings.namingTemplates;
        }
        return persistedState as any;
      },
    }
  )
);
