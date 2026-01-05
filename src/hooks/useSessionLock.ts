import { useState, useEffect } from 'react';
import { useDownloadsStore } from '@/store/useDownloadsStore';
import { fetchActiveDownloads } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

export function useSessionLock() {
    const { jobs, updateJob } = useDownloadsStore();
    const { toast } = useToast();

    // Calculate lock state derived from store
    // A session is active if ANY job is in a non-terminal state
    const isLocked = jobs.some(job =>
        ['queued', 'downloading', 'paused', 'waiting'].includes(job.status)
    );

    // Sync with backend on mount and periodically to ensure robustness
    useEffect(() => {
        // Initial sync
        syncLockState();

        // Poll occasionally to ensure UI doesn't get stuck if window focused/blurred
        const interval = setInterval(syncLockState, 2000);

        return () => clearInterval(interval);
    }, []);

    const syncLockState = async () => {
        try {
            const { downloads } = await fetchActiveDownloads();

            // If backend has NO active downloads, but we think we're locked,
            // we might need to clear stuck jobs.
            const backendHasActive = Object.keys(downloads).length > 0;

            if (!backendHasActive && isLocked) {
                // Double check: filter our local jobs
                const stuckJobs = jobs.filter(job =>
                    ['queued', 'downloading', 'paused', 'waiting'].includes(job.status)
                );

                // If we have stuck jobs that the backend doesn't know about, mark them failed/completed
                // so the UI unlocks.
                stuckJobs.forEach(job => {
                    // This is a safety valve. If backend says "no active downloads", 
                    // then these jobs effectively died or finished without reporting.
                    console.warn(`Reconciling stuck job ${job.id} - backend has no record.`);
                    updateJob(job.id, {
                        status: 'failed',
                        error: 'Session sync: Download interrupted or lost'
                    });
                });
            }
        } catch (error) {
            console.error("Failed to sync lock state:", error);
        }
    };

    const showLockedMessage = () => {
        toast({
            variant: 'default', // Info/Warning style
            title: 'Settings Locked',
            description: 'Downloads are currently in progress. Please wait until they finish or cancel them to change settings.',
            duration: 3000,
        });
    };

    return {
        isLocked,
        showLockedMessage
    };
}
