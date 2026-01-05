import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DownloadJob, HistoryItem } from '@/types';

interface DownloadsState {
    jobs: DownloadJob[];
    addJob: (job: DownloadJob) => void;
    updateJob: (id: string, updates: Partial<DownloadJob>) => void;
    removeJob: (id: string) => void;
    clearCompletedJobs: () => void;

    history: HistoryItem[];
    addToHistory: (item: HistoryItem) => void;
    removeFromHistory: (id: string) => void;
    clearHistory: () => void;
}

export const useDownloadsStore = create<DownloadsState>()(
    persist(
        (set) => ({
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
        }),
        {
            name: 'alp-downloads-storage',
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
        }
    )
);
