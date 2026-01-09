import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUIStore } from '@/store/useUIStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from '@/components/ConfirmModal';
import { RotateCcw, AlertCircle, Type } from 'lucide-react';
import type { DownloadMode, ContentType } from '@/types';
import {
  validateNamingTemplate,
  getDefaultTemplate,
  getMandatoryTags,
  getAllowedTags,
  extractTags,
} from '@/lib/namingValidation';
import { cn } from '@/lib/utils';

interface NamingOptionsProps {
  /** The type of content (single video or playlist) */
  contentType: ContentType;
  /** The download mode (video or audio) */
  mode: DownloadMode;
  /** The currently active template string */
  currentTemplate: string;
  /** Callback fired when the template is successfully saved */
  onTemplateChange: (template: string) => void;
  /** Whether the component is disabled (e.g., during download) */
  disabled?: boolean;
}

/**
 * NamingOptions Component
 * 
 * Provides an interface for configuring custom file naming templates.
 * 
 * Features:
 * - Template Editor: Text input for modifying the template string.
 * - Frontend Validation: Real-time validation of structure and tags using helper functions.
 * - Live Tag Interactions: Clickable badges to insert tags easily at the cursor position.
 * - Persistence: Sames modified templates to the backend (`api/naming-templates`).
 * - Security: Sanitizes input to prevent filesystem errors.
 */
export function NamingOptions({
  contentType,
  mode,
  currentTemplate,
  onTemplateChange,
  disabled
}: NamingOptionsProps) {
  const { settings, updateSettings } = useSettingsStore();
  const { addNotification } = useUIStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentTemplate);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);


  useEffect(() => {
    setEditValue(currentTemplate);
  }, [currentTemplate]);

  const validation = validateNamingTemplate(editValue, contentType, mode);
  const hasError = validation !== null;
  const mandatoryTags = getMandatoryTags(contentType, mode);
  const allowedTags = getAllowedTags(contentType, mode);
  const tagsInTemplate = extractTags(editValue);

  const handleSave = async () => {
    // ❌ If validation error → show error notification and stop
    if (hasError) {
      addNotification({
        type: 'error',
        title: 'Invalid Template',
        message: validation?.message || 'Please fix the template errors before saving.',
      });
      return;
    }

    // Build updated templates object
    const updatedTemplates = {
      ...settings.namingTemplates,
      [contentType]: {
        ...settings.namingTemplates[contentType],
        [mode]: editValue,
      },
    };

    // ✅ Save to backend (persist to disk)
    try {
      const response = await fetch(`${API_BASE_URL}/api/naming-templates`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namingTemplates: updatedTemplates }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save template');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: error instanceof Error ? error.message : 'Could not save template to server.',
      });
      return;
    }

    // ✅ Update local state
    onTemplateChange(editValue);

    // ✅ Update global settings (frontend state)
    updateSettings({ namingTemplates: updatedTemplates });

    // ✅ Success notification
    addNotification({
      type: 'success',
      title: 'Naming Template Saved',
      message: 'Filename template has been saved successfully.',
    });

    // ✅ Exit edit mode
    setIsEditing(false);
  };


  const handleReset = () => {
    const defaultTemplate = getDefaultTemplate(contentType, mode);
    setEditValue(defaultTemplate);
  };

  const confirmReset = () => {
    const defaultTemplate = getDefaultTemplate(contentType, mode);
    setEditValue(defaultTemplate);

    addNotification({
      type: 'success',
      title: 'Template Reset',
      message: 'Filename template has been reset to default.',
    });

    setShowResetConfirm(false);
  };

  const handleCancel = () => {
    setEditValue(currentTemplate);
    setIsEditing(false);
  };

  // Check which mandatory tags are present
  const mandatoryStatus = mandatoryTags.map((tag) => ({
    tag,
    present: tagsInTemplate.includes(tag),
  }));

  return (
    <div className="card-elevated p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Type className="w-4 h-4" />
          Naming Options
        </h3>
        <span className="text-xs text-muted-foreground">
          {contentType === 'playlist' ? 'Playlist' : 'Single'} • {mode === 'video' ? 'Video' : 'Audio'}
        </span>
      </div>

      {/* Template editor */}
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Filename Template</label>
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={getDefaultTemplate(contentType, mode)}
              autoFocus
              className={cn(
                hasError && 'border-destructive focus-visible:ring-destructive/50'
              )}
            />
          </div>

          {/* Error message */}
          {hasError && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="text-sm text-destructive">{validation.message}</div>
            </div>
          )}

          {/* Mandatory tags status */}
          {mandatoryTags.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">
                Required tags:
              </p>

              <div className="flex flex-wrap gap-1.5">
                {mandatoryStatus.map(({ tag, present }) => (
                  <Badge
                    key={tag}
                    variant={present ? "default" : "destructive"}
                    className={cn(
                      "px-2 py-0.5 text-xs font-medium",
                      "transition-colors",
                      present
                        ? "bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/15"
                        : "bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/15"
                    )}
                  >

                    {tag} {present ? "✓" : "✗"}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Available tags */}
          <div className="text-xs space-y-1">
            <p className="text-muted-foreground font-medium">Available tags:</p>
            <div className="flex flex-wrap gap-1.5">
              {allowedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  role="button"
                  onClick={() => {
                    setEditValue((prev) => prev + tag)
                    setActiveTag(tag)
                    setTimeout(() => setActiveTag(null), 200)
                  }}
                  className={cn(
                    "cursor-pointer select-none px-2 py-0.5 text-xs",
                    "transition-all duration-150",
                    "bg-primary/10 text-primary/90",
                    "hover:bg-primary/20",
                    "active:scale-95",
                    activeTag === tag && "bg-primary/30 ring-1 ring-primary/30"
                  )}
                >
                  {tag}
                </Badge>
              ))}
            </div>

          </div>

          {/* Tag descriptions */}
          <div className="text-xs space-y-1 bg-muted/50 p-2 rounded">
            <p className="text-muted-foreground font-medium">Tag Reference:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li><code>&lt;title&gt;</code> - YouTube video title</li>
              {contentType === 'playlist' && <li><code>&lt;index&gt;</code> - Video position in playlist</li>}
              {mode === 'video' && <li><code>&lt;quality&gt;</code> - Download quality</li>}
              <li><code>&lt;channel&gt;</code> - Channel name</li>
              <li><code>&lt;date&gt;</code> - Download date (DD-MM-YYYY)</li>
              <li><code>&lt;format&gt;</code> - Output format</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={hasError}
              className="flex-1"
            >
              Save
            </Button>

            <Button
              variant="secondary"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowResetConfirm(true)}
              title="Reset to default"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Display current template */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground mb-1">Current Template:</p>
              <p className="text-sm font-mono break-words">{currentTemplate}</p>
            </div>
          </div>

          {/* Edit button */}
          <Button
            variant="secondary"
            onClick={() => setIsEditing(true)}
            disabled={disabled}
            className={cn(
              "w-full px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium transition-colors",
              disabled && "opacity-50 cursor-not-allowed hover:bg-primary/10"
            )}
          >
            {disabled ? 'Templates locked during download' : 'Edit Template'}
          </Button>

        </div>
      )}

      <ConfirmModal
        open={showResetConfirm}
        onCancel={() => setShowResetConfirm(false)}
        onConfirm={confirmReset}
      />

    </div>
  );
}
