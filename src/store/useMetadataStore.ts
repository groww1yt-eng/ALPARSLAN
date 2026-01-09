import { create } from 'zustand';
import type { VideoMetadata } from '@/types';

// Store for holding the currently fetched video metadata
// This is transient state, no persistence needed
interface MetadataState {
    currentMetadata: VideoMetadata | null;
    setCurrentMetadata: (metadata: VideoMetadata | null) => void;
}

export const useMetadataStore = create<MetadataState>((set) => ({
    currentMetadata: null,
    setCurrentMetadata: (metadata) => set({ currentMetadata: metadata }),
}));
