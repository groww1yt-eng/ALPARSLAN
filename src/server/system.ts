import { exec } from 'child_process';
import { promisify } from 'util';
import dns from 'dns';

const execAsync = promisify(exec);
const dnsResolve = promisify(dns.resolve);

// Minimum recommended version for yt-dlp to ensure YouTube compatibility
const MIN_YTDLP_VERSION = '2023.01.01'; // Safe baseline, adjust as needed

export interface SystemInfo {
    versions: {
        node: string;
        ytdlp: string;
        ffmpeg: string;
        backend: string;
    };
    health: {
        internet: boolean;
        ytdlp: boolean;
        ffmpeg: boolean;
    };
    updates: {
        ytdlp: {
            current: string;
            latest: string;
            available: boolean;
        };
    };
    // New fields for enhanced compatibility
    compatibility: {
        status: 'compatible' | 'partial' | 'incompatible';
        message: string;
    };
    issues: string[];
    requirements: {
        ytdlp: {
            minVersion: string;
            meetsRequirement: boolean;
        };
    };
}

import { API_VERSION } from './config.js';

// Helper to run command and get output safely
async function getCommandOutput(command: string): Promise<string> {
    try {
        const { stdout } = await execAsync(command);
        return stdout.trim();
    } catch (e) {
        return '';
    }
}

// Check YouTube Extractor Health
async function checkYoutubeExtractor(): Promise<{ status: 'compatible' | 'partial' | 'incompatible'; message: string }> {
    try {
        // "Me at the zoo" - short, stable metadata check
        // Using --flat-playlist and --dump-json is fast and creates minimal network load
        await execAsync('python -m yt_dlp --dump-json --no-warnings --flat-playlist "https://www.youtube.com/watch?v=jNQXAC9IVRw"');
        return { status: 'compatible', message: 'Compatible with current YouTube behavior' };
    } catch (e: any) {
        console.error('Extractor check failed:', e.message);
        const msg = e.message?.toLowerCase() || '';
        if (msg.includes('sign in') || msg.includes('robot') || msg.includes('consent')) {
            return { status: 'partial', message: 'Partial compatibility - YouTube might be blocking automated requests or requiring sign-in' };
        }
        return { status: 'incompatible', message: 'Known incompatibility detected - Failed to fetch standard video metadata' };
    }
}

export async function getSystemInfo(): Promise<SystemInfo> {
    const info: SystemInfo = {
        versions: {
            node: process.version,
            ytdlp: 'Not detected',
            ffmpeg: 'Not detected',
            backend: API_VERSION
        },

        health: {
            internet: false,
            ytdlp: false,
            ffmpeg: false
        },
        updates: {
            ytdlp: {
                current: '',
                latest: '',
                available: false
            }
        },
        compatibility: {
            status: 'incompatible', // Default until checked
            message: 'Checking compatibility...'
        },
        issues: [],
        requirements: {
            ytdlp: {
                minVersion: MIN_YTDLP_VERSION,
                meetsRequirement: false
            }
        }
    };

    // Check Node (already done)

    // Check yt-dlp
    try {
        // Try to get version
        const ytdlpVersion = await getCommandOutput('python -m yt_dlp --version');
        if (ytdlpVersion) {
            info.versions.ytdlp = ytdlpVersion;
            info.health.ytdlp = true;
            info.updates.ytdlp.current = ytdlpVersion;
            // Check min version (lexicographical comparison usually sufficient for YYYY.MM.DD)
            info.requirements.ytdlp.meetsRequirement = ytdlpVersion >= MIN_YTDLP_VERSION;
        }
    } catch (e) { }

    // Check ffmpeg
    try {
        const ffmpegOutput = await getCommandOutput('ffmpeg -version');
        const firstLine = ffmpegOutput.split('\n')[0];
        if (firstLine) {
            // Extract version "ffmpeg version 6.1 ..."
            const match = firstLine.match(/ffmpeg version (\S+)/);
            info.versions.ffmpeg = match ? match[1] : firstLine;
            info.health.ffmpeg = true;
        }
    } catch (e) { }

    // Check Internet
    try {
        await dnsResolve('google.com');
        info.health.internet = true;
    } catch (e) {
        // Try fallback
        try {
            await dnsResolve('8.8.8.8'); // Cloudflare
            info.health.internet = true;
        } catch (e2) { }
    }

    // Check Extractor Status (Only if internet and ytdlp present)
    if (info.health.internet && info.health.ytdlp) {
        const extStatus = await checkYoutubeExtractor();
        info.compatibility = extStatus;

        if (extStatus.status !== 'compatible') {
            info.issues.push('YouTube API change detected or IP blocking active: ' + extStatus.message);
        }
    } else if (!info.health.internet) {
        info.compatibility = { status: 'incompatible', message: 'No internet connection' };
    } else {
        info.compatibility = { status: 'incompatible', message: 'yt-dlp compiler not found' };
        info.issues.push('yt-dlp is missing. Please install it to use this application.');
    }

    // Check yt-dlp updates (optional: fetch from github)
    if (info.health.internet) {
        try {
            // We can't easily fetch external URLs without 'fetch' in Node 18+ or axios.
            // Assuming Node 18+ (has global fetch)
            const res = await fetch('https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest');
            if (res.ok) {
                const data = await res.json();
                const latestTag = data.tag_name; // e.g. "2024.03.10"
                if (latestTag) {
                    info.updates.ytdlp.latest = latestTag;
                    // Simple string comparison or semver? yt-dlp uses dates YYYY.MM.DD
                    if (info.versions.ytdlp !== 'Not detected' && info.versions.ytdlp !== latestTag) {
                        info.updates.ytdlp.available = true;
                    }
                }
            }
        } catch (e) {
            // Ignore update check failure
        }
    }

    // Add issue if min requirement not met
    if (info.health.ytdlp && !info.requirements.ytdlp.meetsRequirement) {
        info.issues.push(`Installed yt-dlp version (${info.versions.ytdlp}) is older than recommended (${MIN_YTDLP_VERSION}). Update strongly recommended.`);
    }

    return info;
}
