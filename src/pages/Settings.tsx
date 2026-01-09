import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUIStore } from '@/store/useUIStore';
import { Switch } from '@/components/ui/switch';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from '@/components/ConfirmModal';
import { Settings as SettingsIcon, Folder, Save, RotateCcw, Lock } from 'lucide-react';
import { useSessionLock } from '@/hooks/useSessionLock';
import type { DownloadMode, VideoQuality, AudioFormat } from '@/types';
import { useNavigate, useLocation, useBlocker } from 'react-router-dom';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";



/**
 * Settings Page Component
 * 
 * Manages global application settings and preferences.
 * 
 * Key features:
 * - Uses a "Draft" state (`draftSettings`) allows users to make multiple changes 
 *   before committing them to the store with "Save".
 * - Blocks navigation (using `useBlocker` or `beforeUnload`) if there are unsaved changes.
 * - Handles resetting settings to defaults.
 * - Respects the global session lock to prevent critical changes during active downloads.
 */
export default function Settings() {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const { addNotification } = useUIStore();
  const { isLocked, showLockedMessage } = useSessionLock();

  // Local state for draft settings to allow "Save" confirmation pattern
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [draftSettings, setDraftSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<null | (() => void)>(null);


  // Prevent closing window with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasChanges) return;
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const tryNavigate = (action: () => void) => {
    if (hasChanges) {
      setPendingAction(() => action);
      setShowUnsavedConfirm(true);
    } else {
      action();
    }
  };



  const handleSave = () => {
    updateSettings(draftSettings);
    setHasChanges(false);

    addNotification({
      type: 'success',
      title: 'Settings Saved',
      message: 'Your preferences have been updated',
    });
  };

  const confirmResetSettings = () => {
    resetSettings();
    setDraftSettings(settings);
    setHasChanges(false);

    addNotification({
      type: 'success',
      title: 'Settings Reset',
      message: 'All settings have been reset to default.',
    });

    setShowResetConfirm(false);
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="card-elevated p-4 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          {isLocked ? <Lock className="w-4 h-4 text-primary" /> : <Folder className="w-4 h-4" />}
          Output Folder
        </h3>

        <div onClickCapture={isLocked ? showLockedMessage : undefined}>
          <Input
            value={draftSettings.outputFolder}
            disabled={isLocked}
            onChange={(e) => {
              setDraftSettings(prev => ({
                ...prev,
                outputFolder: e.target.value
              }))
              setHasChanges(true);
            }}
          />
        </div>
      </div>

      <div className="card-elevated p-4 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          {isLocked ? <Lock className="w-4 h-4 text-primary" /> : <SettingsIcon className="w-4 h-4" />}
          Default Settings
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div onClickCapture={isLocked ? showLockedMessage : undefined}>
            <label className="text-sm text-muted-foreground mb-2 block">Mode</label>
            <Select
              disabled={isLocked}
              value={draftSettings.defaultMode}
              onValueChange={(value) => {
                setDraftSettings(prev => ({
                  ...prev,
                  defaultMode: value as any
                }))
                setHasChanges(true);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="video">Video + Audio</SelectItem>
                <SelectItem value="audio">Audio Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div onClickCapture={isLocked ? showLockedMessage : undefined}>
            <label className="text-sm text-muted-foreground mb-2 block">Quality</label>
            <Select
              disabled={isLocked}
              value={draftSettings.defaultQuality}
              onValueChange={(value) => {
                setDraftSettings(prev => ({
                  ...prev,
                  defaultQuality: value as VideoQuality
                }))
                setHasChanges(true);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="360p">360p</SelectItem>
                <SelectItem value="480p">480p</SelectItem>
                <SelectItem value="720p">720p</SelectItem>
                <SelectItem value="1080p">1080p</SelectItem>
                <SelectItem value="1440p">1440p</SelectItem>
                <SelectItem value="2160p">2160p</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div onClickCapture={isLocked ? showLockedMessage : undefined}>
            <label className="text-sm text-muted-foreground mb-2 block">Audio Format</label>
            <Select
              disabled={isLocked}
              value={draftSettings.defaultFormat}
              onValueChange={(value) => {
                setDraftSettings(prev => ({
                  ...prev,
                  defaultFormat: value as AudioFormat
                }))
                setHasChanges(true);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select audio format" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="mp3">MP3</SelectItem>
                <SelectItem value="m4a">M4A</SelectItem>
                <SelectItem value="wav">WAV</SelectItem>
                <SelectItem value="opus">OPUS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div onClickCapture={isLocked ? showLockedMessage : undefined}>
            <label className="text-sm text-muted-foreground mb-2 block">Subtitle Language</label>
            <Select
              disabled={isLocked}
              value={draftSettings.subtitleLanguage}
              onValueChange={(value) => {
                setDraftSettings(prev => ({
                  ...prev,
                  subtitleLanguage: value as 'auto' | 'en'
                }))
                setHasChanges(true);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (YouTube Default)</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3" onClickCapture={isLocked ? showLockedMessage : undefined}>
          <Switch
            disabled={isLocked}
            checked={draftSettings.downloadSubtitles}
            onCheckedChange={(checked) => {
              setDraftSettings(prev => ({
                ...prev,
                downloadSubtitles: checked
              }))
              setHasChanges(true);
            }}
          />
          <span className="text-sm">Download Subtitles</span>
        </div>

        <div className="flex items-center gap-3" onClickCapture={isLocked ? showLockedMessage : undefined}>
          <Switch
            disabled={isLocked}
            checked={draftSettings.perChannelFolders}
            onCheckedChange={(checked) => {
              setDraftSettings(prev => ({
                ...prev,
                perChannelFolders: checked
              }))
              setHasChanges(true);
            }}
          />
          <span className="text-sm">Create Per-Channel Sub-Folders</span>
        </div>
      </div>

      <div className="flex gap-3">
        {/* Save Settings */}
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          className="flex-1 gap-2"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </Button>

        {/* Reset */}
        <div onClickCapture={isLocked ? showLockedMessage : undefined}>
          <Button
            variant="secondary"
            size="icon"
            disabled={isLocked}
            onClick={() => setShowResetConfirm(true)}
            title="Reset to default"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={showResetConfirm}
        onCancel={() => setShowResetConfirm(false)}
        onConfirm={confirmResetSettings}
      />

      <ConfirmModal
        open={showUnsavedConfirm}
        title="Are you sure?"
        message="You have unsaved changes. Please confirm if you want to proceed."
        onCancel={() => {
          setShowUnsavedConfirm(false);
          setPendingAction(null);
        }}
        onConfirm={() => {
          setShowUnsavedConfirm(false);
          setHasChanges(false);
          pendingAction?.();
          setPendingAction(null);
        }}
      />

    </div>
  );
}
