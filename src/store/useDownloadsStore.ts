import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DownloadJob, HistoryItem } from '@/types';

// Interface defining the shape of our downloads store
interface DownloadsState {
    // Active jobs list
    jobs: DownloadJob[];
    addJob: (job: DownloadJob) => void;
    updateJob: (id: string, updates: Partial<DownloadJob>) => void;
    removeJob: (id: string) => void;
    clearCompletedJobs: () => void;

    // Completed history list
    history: HistoryItem[];
    addToHistory: (item: HistoryItem) => void;
    removeFromHistory: (id: string) => void;
    clearHistory: () => void;
}

// Global store for managing download jobs and history
export const useDownloadsStore = create<DownloadsState>()(
    persist(
        (set) => ({
            jobs: [],
            // Add a new job to the top of the list
            addJob: (job) =>
                set((state) => ({
                    jobs: [job, ...state.jobs],
                })),
            // Update a specific job by ID
            updateJob: (id, updates) =>
                set((state) => ({
                    jobs: state.jobs.map((job) =>
                        job.id === id ? { ...job, ...updates } : job
                    ),
                })),
            // Remove a job entirely (e.g. cancelled)
            removeJob: (id) =>
                set((state) => ({
                    jobs: state.jobs.filter((job) => job.id !== id),
                })),
            // Clear jobs that have finished successfully (moved to history usually)
            clearCompletedJobs: () =>
                set((state) => ({
                    jobs: state.jobs.filter((job) => job.status !== 'completed'),
                })),

            history: [],
            // Add completed item to history
            addToHistory: (item) =>
                set((state) => ({
                    history: [item, ...state.history],
                })),
            // Remove single history item
            removeFromHistory: (id) =>
                set((state) => ({
                    history: state.history.filter((item) => item.id !== id),
                })),
            // Clear entire history
            clearHistory: () => set({ history: [] }),
        }),
        {
            name: 'alp-downloads-storage', // LocalStorage key
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Reset any 'active' jobs to paused on reload
                    // This prevents UI from showing "Downloading" for jobs that were killed when the app closed
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
