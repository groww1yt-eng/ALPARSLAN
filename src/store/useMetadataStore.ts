import { create } from 'zustand';
import type { VideoMetadata } from '@/types';

interface MetadataState {
    currentMetadata: VideoMetadata | null;
    setCurrentMetadata: (metadata: VideoMetadata | null) => void;
}

export const useMetadataStore = create<MetadataState>((set) => ({
    currentMetadata: null,
    setCurrentMetadata: (metadata) => set({ currentMetadata: metadata }),
}));
