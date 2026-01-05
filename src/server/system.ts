import { exec } from 'child_process';
import { promisify } from 'util';
import dns from 'dns';
import fs from 'fs';
import path from 'path';

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
    // Advanced Diagnostics
    permissions: {
        writeAccess: boolean;
        outputFolder: string;
    };
    dns: {
        status: 'ok' | 'fail' | 'slow';
        responseTime: number; // ms
    };
    ipReputation: {
        status: 'clean' | 'blocked' | 'throttled' | 'unknown';
        message: string;
    };
    ffmpegCodecs: {
        mp3: boolean;
        aac: boolean;
        h264: boolean;
    };
    pythonInfo: {
        version: string;
        isVenv: boolean;
    };
    cookies: {
        present: boolean;
        fileName: string;
        sizeBytes: number;
    };
    proxy: {
        detected: boolean;
        url: string;
        status: 'working' | 'failing' | 'none';
    };
    networkPath: {
        clientToBackend: boolean; // Always true if reaching this
        backendToInternet: boolean;
        backendToYouTube: boolean;
    };
    lastChecked: string;
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

// Check Folder Write Permissions
async function checkPermissions(folder: string): Promise<{ writeAccess: boolean; outputFolder: string }> {
    const resolvedPath = path.resolve(folder);
    try {
        if (!fs.existsSync(resolvedPath)) {
            // Try to create it to check permissions
            fs.mkdirSync(resolvedPath, { recursive: true });
        }
        const testFile = path.join(resolvedPath, `.alp_write_test_${Date.now()}`);
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        return { writeAccess: true, outputFolder: resolvedPath };
    } catch (e) {
        return { writeAccess: false, outputFolder: resolvedPath };
    }
}

// Check DNS Health
async function checkDnsHealth(): Promise<{ status: 'ok' | 'fail' | 'slow'; responseTime: number }> {
    const start = Date.now();
    try {
        await dnsResolve('youtube.com');
        const duration = Date.now() - start;
        return {
            status: duration > 500 ? 'slow' : 'ok',
            responseTime: duration
        };
    } catch (e) {
        return { status: 'fail', responseTime: Date.now() - start };
    }
}

// Check IP Reputation
async function checkIpReputation(): Promise<{ status: 'clean' | 'blocked' | 'throttled' | 'unknown'; message: string }> {
    try {
        // Simple fetch test to YouTube
        const res = await fetch('https://www.youtube.com/', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (res.status === 403) return { status: 'blocked', message: 'IP seems to be blocked by YouTube (403 Forbidden)' };
        if (res.status === 429) return { status: 'throttled', message: 'IP is being rate-limited (429 Too Many Requests)' };
        if (res.ok) return { status: 'clean', message: 'IP connectivity is healthy' };
        return { status: 'unknown', message: `Server returned status ${res.status}` };
    } catch (e: any) {
        return { status: 'unknown', message: e.message || 'Connectivity check failed' };
    }
}

// Check FFmpeg Codecs
async function checkFfmpegCodecs(): Promise<{ mp3: boolean; aac: boolean; h264: boolean }> {
    const output = await getCommandOutput('ffmpeg -codecs');
    return {
        mp3: output.includes('libmp3lame') || output.includes('mp3'),
        aac: output.includes('aac'),
        h264: output.includes('libx264') || output.includes('h264')
    };
}

// Get Python Environment Info
async function getPythonInfo(): Promise<{ version: string; isVenv: boolean }> {
    const version = await getCommandOutput('python --version');
    const isVenv = !!(process.env.VIRTUAL_ENV || process.env.CONDA_PREFIX);
    return { version: version || 'Not detected', isVenv };
}

// Check YouTube Cookies
async function checkCookieStatus(): Promise<{ present: boolean; fileName: string; sizeBytes: number }> {
    const cookiePath = path.resolve(process.cwd(), 'cookies.txt');
    if (fs.existsSync(cookiePath)) {
        const stats = fs.statSync(cookiePath);
        return { present: true, fileName: 'cookies.txt', sizeBytes: stats.size };
    }
    return { present: false, fileName: '', sizeBytes: 0 };
}

// Check Proxy Status
async function checkProxyStatus(): Promise<{ detected: boolean; url: string; status: 'working' | 'failing' | 'none' }> {
    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy;
    if (!proxyUrl) return { detected: false, url: '', status: 'none' };

    try {
        // Simple connectivity test through the proxy environment
        const res = await fetch('https://www.google.com', { method: 'HEAD', signal: AbortSignal.timeout(3000) });
        return { detected: true, url: proxyUrl, status: res.ok ? 'working' : 'failing' };
    } catch {
        return { detected: true, url: proxyUrl, status: 'failing' };
    }
}

export async function getSystemInfo(outputPath?: string): Promise<SystemInfo> {
    const defaultOutput = outputPath || 'C:\\Users\\ariya\\Downloads\\ALP';

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
        },
        permissions: { writeAccess: false, outputFolder: defaultOutput },
        dns: { status: 'fail', responseTime: 0 },
        ipReputation: { status: 'unknown', message: 'Checking...' },
        ffmpegCodecs: { mp3: false, aac: false, h264: false },
        pythonInfo: { version: 'Checking...', isVenv: false },
        cookies: { present: false, fileName: '', sizeBytes: 0 },
        proxy: { detected: false, url: '', status: 'none' },
        networkPath: {
            clientToBackend: true,
            backendToInternet: false,
            backendToYouTube: false
        },
        lastChecked: new Date().toISOString()
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

    // Advanced Diagnostics
    info.permissions = await checkPermissions(defaultOutput);
    info.dns = await checkDnsHealth();
    info.ipReputation = await checkIpReputation();
    info.ffmpegCodecs = await checkFfmpegCodecs();
    info.pythonInfo = await getPythonInfo();
    info.cookies = await checkCookieStatus();
    info.proxy = await checkProxyStatus();

    // Populate Network Path
    info.networkPath.backendToInternet = info.health.internet;
    info.networkPath.backendToYouTube = info.compatibility.status === 'compatible' || info.compatibility.status === 'partial';

    return info;
}

