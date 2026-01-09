import fs from 'fs';
import path from 'path';

export type DownloadMode = 'video' | 'audio';
export type ContentType = 'single' | 'playlist';

// Interface defining the structure of naming templates for different modes
export interface NamingTemplates {
  single: {
    video: string;
    audio: string;
  };
  playlist: {
    video: string;
    audio: string;
  };
}

// Server-side settings interface
interface ServerSettings {
  namingTemplates: NamingTemplates;
}

// Path to the persistent settings JSON file
const SETTINGS_FILE_PATH = path.resolve(process.cwd(), '.alp-settings.json');

// Default templates if no settings file exists
export function getDefaultNamingTemplates(): NamingTemplates {
  return {
    single: {
      video: '<title> - <quality>',
      audio: '<title>',
    },
    playlist: {
      video: '<index> - <title> - <quality>',
      audio: '<index> - <title>',
    },
  };
}

function getDefaultServerSettings(): ServerSettings {
  return {
    namingTemplates: getDefaultNamingTemplates(),
  };
}

// Read settings from disk (synchronous)
function readSettingsFile(): ServerSettings {
  if (!fs.existsSync(SETTINGS_FILE_PATH)) {
    return getDefaultServerSettings();
  }

  const raw = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
  const parsed = JSON.parse(raw) as Partial<ServerSettings>;

  if (!parsed.namingTemplates) {
    return getDefaultServerSettings();
  }

  return {
    namingTemplates: parsed.namingTemplates as NamingTemplates,
  };
}

// Write settings to disk (synchronous, with atomic rename)
function writeSettingsFile(settings: ServerSettings): void {
  const dir = path.dirname(SETTINGS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write to temp file then rename to ensure atomicity and prevent corruption
  const tmpPath = `${SETTINGS_FILE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(settings, null, 2), 'utf-8');
  fs.renameSync(tmpPath, SETTINGS_FILE_PATH);
}

// Public API to get current templates
export function getNamingTemplates(): NamingTemplates {
  try {
    return readSettingsFile().namingTemplates;
  } catch {
    return getDefaultNamingTemplates();
  }
}

// Public API to save new templates
export function setNamingTemplates(namingTemplates: NamingTemplates): void {
  const settings: ServerSettings = { namingTemplates };
  writeSettingsFile(settings);
}
