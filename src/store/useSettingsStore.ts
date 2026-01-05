import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '@/types';

interface SettingsState {
    settings: AppSettings;
    updateSettings: (settings: Partial<AppSettings>) => void;
    resetSettings: () => void;
}

const getDefaultOutputFolder = (): string => {
    // Detect Android
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
        return '/storage/emulated/0/ALP/';
    }
    return 'C:\\Users\\ariya\\Downloads\\ALP';
};

export const defaultSettings: AppSettings = {
    outputFolder: getDefaultOutputFolder(),
    defaultMode: 'video',
    defaultQuality: '1080p',
    defaultFormat: 'mp3',
    downloadSubtitles: false,
    subtitleLanguage: 'auto',
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

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            settings: defaultSettings,
            updateSettings: (updates) =>
                set((state) => ({
                    settings: { ...state.settings, ...updates },
                })),
            resetSettings: () => set({ settings: defaultSettings }),
        }),
        {
            name: 'alp-settings-storage',
            migrate: (persistedState: any, version: number) => {
                if (persistedState && persistedState.settings && !persistedState.settings.namingTemplates) {
                    persistedState.settings.namingTemplates = defaultSettings.namingTemplates;
                }
                return persistedState as SettingsState;
            },
        }
    )
);
