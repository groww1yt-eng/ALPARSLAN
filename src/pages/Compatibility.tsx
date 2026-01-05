import { useState, useEffect } from 'react';
import { API_BASE_URL, EXPECTED_API_VERSION } from '@/config';
import { useAppStore } from '@/store/useAppStore';
import {
    Server,
    Wifi,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    RefreshCw,
    Copy,
    Terminal,
    Cpu,
    ShieldAlert,
    Activity,
    HardDrive,
    Search,
    Globe,
    Code2,
    History as HistoryIcon,
    ShieldCheck,
    Lock,
    Cookie,
    Link,
    ArrowRight,
    Shield,
    Check
} from 'lucide-react';




import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { handleAppError } from '@/lib/errorHandler';

interface SystemInfo {
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
    permissions: {
        writeAccess: boolean;
        outputFolder: string;
    };
    dns: {
        status: 'ok' | 'fail' | 'slow';
        responseTime: number;
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
        clientToBackend: boolean;
        backendToInternet: boolean;
        backendToYouTube: boolean;
    };
    lastChecked: string;
}



export default function Compatibility() {
    const [info, setInfo] = useState<SystemInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useAppStore();

    const fetchSystemInfo = async () => {
        setLoading(true);
        try {
            const folder = useAppStore.getState().settings.outputFolder;
            const res = await fetch(`${API_BASE_URL}/api/system-info?outputPath=${encodeURIComponent(folder)}`);
            // If HTML returned (parsing error), throw distinctive error
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                throw new Error('Server returned HTML instead of JSON. Check API route configuration.');
            }

            if (!res.ok) throw new Error('Failed to fetch system info');
            const data = await res.json();
            setInfo(data);
        } catch (error) {
            handleAppError(error);
        } finally {
            setLoading(false);
        }
    };

    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        fetchSystemInfo();
    }, []);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        addNotification({ type: 'success', title: 'Copied', message: 'Instructions copied to clipboard' });
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center flex-col gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Running system diagnostics...</p>
            </div>
        );
    }

    if (!info) return null;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 pb-12">
            <div>
                <h2 className="text-lg font-medium text-black dark:text-white">Diagnostic information, system status and updates.</h2>
            </div>

            {/* Premium Live Network Integrity Visualization */}
            <div className="bg-card border rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/40 overflow-hidden relative group">
                {/* Decorative background effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/20 transition-colors duration-1000" />

                <div className="relative p-3 md:p-4 flex flex-col items-center gap-4">
                    <div className="flex flex-col items-center gap-1.5 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary mb-1">
                            <Activity className="w-3.5 h-3.5 animate-pulse" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Real-time Status</span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-foreground">Live Network Integrity</h2>
                        <p className="text-xs text-muted-foreground max-w-md">
                            Monitoring data flow and connectivity health across the entire delivery chain.
                        </p>
                    </div>

                    <div className="w-full max-w-4xl relative min-h-[300px] md:min-h-[120px] flex items-center justify-center">
                        <PremiumNetworkViz path={info.networkPath} />
                    </div>
                </div>
            </div>


            {/* Known Issues / Warnings */}
            {info.issues.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-5 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-2 mb-3">
                        <ShieldAlert className="w-6 h-6 text-destructive" />
                        <h2 className="font-semibold text-lg text-destructive">Known Issues & Warnings</h2>
                    </div>
                    <ul className="space-y-2">
                        {info.issues.map((issue, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                                <AlertTriangle className="w-4 h-4 mt-0.5 text-orange-500 shrink-0" />
                                <span>{issue}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Extractor Compatibility Status */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-card border rounded-xl p-5 shadow-sm col-span-full">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-lg">YouTube Extractor Status</h2>
                    </div>

                    <div className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border",
                        info.compatibility.status === 'compatible' ? "bg-green-500/10 border-green-500/20" :
                            info.compatibility.status === 'partial' ? "bg-yellow-500/10 border-yellow-500/20" :
                                "bg-destructive/10 border-destructive/20"
                    )}>
                        {info.compatibility.status === 'compatible' ? (
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        ) : info.compatibility.status === 'partial' ? (
                            <AlertTriangle className="w-8 h-8 text-yellow-500" />
                        ) : (
                            <XCircle className="w-8 h-8 text-destructive" />
                        )}

                        <div>
                            <h3 className={cn(
                                "font-bold text-lg",
                                info.compatibility.status === 'compatible' ? "text-green-700 dark:text-green-400" :
                                    info.compatibility.status === 'partial' ? "text-yellow-700 dark:text-yellow-400" :
                                        "text-destructive"
                            )}>
                                {info.compatibility.status === 'compatible' ? 'Compatible' :
                                    info.compatibility.status === 'partial' ? 'Partial Compatibility' : 'Incompatible'}
                            </h3>
                            <p className="text-foreground/80">{info.compatibility.message}</p>
                        </div>
                    </div>

                    {/* Integrated API Version Check */}
                    <div className={cn(
                        "mt-4 p-4 rounded-lg border flex items-center justify-between",
                        info.versions.backend === EXPECTED_API_VERSION ? "bg-muted/30 border-border" : "bg-destructive/10 border-destructive/20"
                    )}>
                        <div className="flex items-center gap-3">
                            <Server className={cn("w-5 h-5", info.versions.backend === EXPECTED_API_VERSION ? "text-muted-foreground" : "text-destructive")} />
                            <div>
                                <p className={cn("text-sm font-medium", info.versions.backend !== EXPECTED_API_VERSION && "text-destructive")}>
                                    API Version: {info.versions.backend}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Expected: {EXPECTED_API_VERSION}
                                </p>
                            </div>
                        </div>

                        {info.versions.backend === EXPECTED_API_VERSION ? (
                            <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                Synchronized
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 text-destructive text-xs font-medium">
                                <AlertTriangle className="w-4 h-4" />
                                Mismatch detected
                            </div>
                        )}
                    </div>
                </div>


                {/* System Versions */}
                <div className="bg-card border rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Cpu className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-lg">Current Versions</h2>
                    </div>
                    <div className="space-y-3">
                        <VersionRow label="Frontend Version" value="v1.0.0" />
                        <VersionRow label="Backend API" value={info.versions.backend} />
                        <VersionRow label="Node.js" value={info.versions.node} />
                        <VersionRow label="yt-dlp" value={info.versions.ytdlp} />
                        <VersionRow label="ffmpeg" value={info.versions.ffmpeg} />
                    </div>
                </div>

                {/* Health Check */}
                <div className="bg-card border rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <h2 className="font-semibold text-lg">System Health</h2>
                    </div>
                    <div className="space-y-3">
                        <HealthRow label="Backend Connection" status={true} />
                        <HealthRow label="Internet Access" status={info.health.internet} />
                        <HealthRow label="yt-dlp Detected" status={info.health.ytdlp} />
                        <HealthRow label="ffmpeg Detected" status={info.health.ffmpeg} />
                    </div>
                </div>

                {/* Permissions Audit */}
                <div className="bg-card border rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Lock className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-lg">Permissions Audit</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Output Folder</span>
                            <code className="text-[10px] bg-muted p-1 rounded break-all">{info.permissions.outputFolder}</code>
                        </div>
                        <HealthRow label="Write Access" status={info.permissions.writeAccess} />
                        {!info.permissions.writeAccess && (
                            <p className="text-[10px] text-destructive mt-1 italic">
                                * The server does not have permission to write to this folder. Please adjust system permissions.
                            </p>
                        )}
                    </div>
                </div>

                {/* YouTube Cookies & Authentication */}
                <div className="bg-card border rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Cookie className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-lg">Cookies & Auth</h2>
                    </div>
                    <div className="space-y-4">
                        <HealthRow label="cookies.txt Present" status={info.cookies.present} />
                        {info.cookies.present ? (
                            <div className="bg-muted/30 p-2 rounded border space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase">File Details</p>
                                <p className="text-xs font-mono">{info.cookies.fileName} ({(info.cookies.sizeBytes / 1024).toFixed(1)} KB)</p>
                                <p className="text-[9px] text-green-600 font-medium">Ready for restricted content</p>
                            </div>
                        ) : (
                            <div className="bg-destructive/5 p-2 rounded border border-destructive/10">
                                <p className="text-[10px] text-destructive">No cooklie file found. Private or age-restricted videos may fail to download.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Proxy Settings */}
                <div className="bg-card border rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-lg">Proxy Configuration</h2>
                    </div>
                    <div className="space-y-4">
                        <HealthRow label="Environment Proxy" status={info.proxy.detected} />
                        {info.proxy.detected ? (
                            <div className="bg-muted/30 p-2 rounded border space-y-1 overflow-hidden">
                                <p className="text-[10px] text-muted-foreground uppercase">Active Proxy</p>
                                <p className="text-xs font-mono truncate">{info.proxy.url}</p>
                                <span className={cn(
                                    "text-[9px] px-1.5 py-0.5 rounded font-bold border",
                                    info.proxy.status === 'working' ? "bg-green-500/10 border-green-500/20 text-green-700" : "bg-red-500/10 border-red-500/20 text-red-700"
                                )}>
                                    CONNECTION: {info.proxy.status.toUpperCase()}
                                </span>
                            </div>
                        ) : (
                            <p className="text-[10px] text-muted-foreground italic">No system proxies detected. Using direct connection.</p>
                        )}
                    </div>
                </div>

                {/* Network Diagnostics */}
                <div className="bg-card border rounded-xl p-5 shadow-sm">

                    <div className="flex items-center gap-2 mb-4">
                        <Search className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-lg">Network Diagnostics</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">DNS Resolution</span>
                            </div>
                            <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium",
                                info.dns.status === 'ok' ? "bg-green-100 text-green-700" :
                                    info.dns.status === 'slow' ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                            )}>
                                {info.dns.status.toUpperCase()} ({info.dns.responseTime}ms)
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">IP Reputation</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground break-words">{info.ipReputation.message}</p>
                            <span className={cn(
                                "text-[10px] w-fit px-1.5 py-0.5 rounded uppercase font-bold",
                                info.ipReputation.status === 'clean' ? "text-green-600" : "text-destructive"
                            )}>
                                {info.ipReputation.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Toolchain Details */}
                <div className="bg-card border rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Code2 className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-lg">Toolchain Details</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-muted/30 p-2 rounded border">
                                <p className="text-[10px] text-muted-foreground uppercase">Python Version</p>
                                <p className="text-xs font-mono truncate">{info.pythonInfo.version.replace('Python ', '')}</p>
                            </div>
                            <div className="bg-muted/30 p-2 rounded border">
                                <p className="text-[10px] text-muted-foreground uppercase">Environment</p>
                                <p className="text-xs">{info.pythonInfo.isVenv ? 'Virtual Env' : 'Global'}</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-medium">FFmpeg Codecs</p>
                            <div className="flex gap-2 flex-wrap">
                                <CodecBadge label="MP3" supported={info.ffmpegCodecs.mp3} />
                                <CodecBadge label="AAC" supported={info.ffmpegCodecs.aac} />
                                <CodecBadge label="H.264" supported={info.ffmpegCodecs.h264} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Requirements Check */}
            <div className="bg-card border rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <ShieldAlert className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-lg">Version Requirements</h2>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/30 rounded-lg border gap-4">
                    <div>
                        <h3 className="font-medium">yt-dlp Version Requirement</h3>
                        <div className="text-sm mt-1 space-y-1">
                            <p className="text-muted-foreground">Installed: <span className="font-mono text-foreground">{info.versions.ytdlp}</span></p>
                            <p className="text-muted-foreground">Minimum Recommended: <span className="font-mono text-foreground">{info.requirements.ytdlp.minVersion}</span></p>
                        </div>
                    </div>

                    {info.requirements.ytdlp.meetsRequirement ? (
                        <div className="flex items-center gap-2 text-green-600 bg-green-100 dark:bg-green-900/20 px-3 py-1.5 rounded-full text-sm font-medium">
                            <CheckCircle2 className="w-4 h-4" />
                            Meets Requirement
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-red-600 bg-red-100 dark:bg-red-900/20 px-3 py-1.5 rounded-full text-sm font-medium">
                            <AlertTriangle className="w-4 h-4" />
                            Update Recommended
                        </div>
                    )}
                </div>
            </div>


            {/* Guided Update Instructions */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 text-primary" />
                            <h2 className="font-semibold text-lg">Update yt-dlp</h2>
                        </div>
                        {info.updates.ytdlp.available ? (
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-bold">UPDATE AVAILABLE</span>
                        ) : (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">UP TO DATE</span>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="text-xs text-muted-foreground space-y-2">
                            <p>Installed: <span className="font-mono text-foreground font-bold">{info.versions.ytdlp}</span></p>
                            {info.updates.ytdlp.latest ? (
                                <p>Latest: <span className="font-mono text-foreground font-bold">{info.updates.ytdlp.latest}</span></p>
                            ) : (
                                <p className="text-destructive italic underline">Unable to check for updates</p>
                            )}
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Terminal className="w-4 h-4" />
                                Option 1: Command Line
                            </h3>
                            <div className="bg-background p-2 rounded border flex items-center justify-between">
                                <code className="text-xs font-mono">yt-dlp -U</code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-6 w-6 transition-all duration-300 hover:bg-transparent",
                                        copiedId === 'update' ? "text-green-500 scale-110 hover:text-green-500" : "text-foreground/80 hover:text-primary opacity-100"
                                    )}
                                    onClick={() => copyToClipboard('yt-dlp -U', 'update')}
                                >
                                    {copiedId === 'update' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3 h-3" />}
                                </Button>
                            </div>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                Option 2: Manual Download
                            </h3>
                            <p className="text-[10px] text-muted-foreground">
                                Download the latest release from the official repository and replace the existing binary.
                                Restart the server after updating.
                            </p>
                            <Button variant="outline" size="sm" className="w-full text-[10px]" asChild>
                                <a href="https://github.com/yt-dlp/yt-dlp/releases" target="_blank" rel="noopener noreferrer">
                                    Official Repository
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Cache Management & Security */}
                <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-lg">Maintenance & Security</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                            <h3 className="text-sm font-semibold">Cache Management</h3>
                            <p className="text-[10px] text-muted-foreground">
                                If you experience metadata fetching issues, clearing the internal cache might help.
                            </p>
                            <div className="bg-background p-2 rounded border flex items-center justify-between">
                                <code className="text-[10px] font-mono">yt-dlp --rm-cache-dir</code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-6 w-6 transition-all duration-300 hover:bg-transparent",
                                        copiedId === 'cache' ? "text-green-500 scale-110 hover:text-green-500" : "text-foreground/80 hover:text-primary opacity-100"
                                    )}
                                    onClick={() => copyToClipboard('yt-dlp --rm-cache-dir', 'cache')}
                                >
                                    {copiedId === 'cache' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3 h-3" />}
                                </Button>
                            </div>
                        </div>

                        <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-lg space-y-2">
                            <div className="flex items-center gap-2 text-yellow-700">
                                <ShieldAlert className="w-4 h-4" />
                                <h3 className="text-sm font-bold">Security Notice</h3>
                            </div>
                            <p className="text-[10px] leading-relaxed text-yellow-800/80">
                                To ensure server security, this interface <strong>cannot</strong> execute system commands, install binaries, or modify server files.
                                All upgrades and maintenance must be performed <strong>manually</strong> by the server owner.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Last Checked */}
            <div className="flex items-center justify-center gap-2 text-muted-foreground py-4 border-t border-dashed">
                <HistoryIcon className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-wider font-medium">
                    Diagnostics last run: {formatDate(info.lastChecked)}
                </span>
            </div>
        </div>
    );
}

interface NetworkPath {
    clientToBackend: boolean;
    backendToInternet: boolean;
    backendToYouTube: boolean;
}

function PremiumNetworkViz({ path }: { path: NetworkPath }) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Desktop: Horizontal alignment
    const desktopNodes = [
        { id: 'client', x: 10, y: 50, icon: <Globe className="w-5 h-5" />, label: 'You', status: true },
        { id: 'backend', x: 36, y: 50, icon: <Server className="w-5 h-5" />, label: 'ALPARSLAN', status: path.clientToBackend },
        { id: 'internet', x: 63, y: 50, icon: <Wifi className="w-5 h-5" />, label: 'World', status: path.backendToInternet },
        { id: 'youtube', x: 90, y: 50, icon: <Activity className="w-5 h-5" />, label: 'YouTube', status: path.backendToYouTube },
    ];

    // Mobile: Vertical Zigzag alignment
    const mobileNodes = [
        { id: 'client', x: 25, y: 15, icon: <Globe className="w-5 h-5" />, label: 'You', status: true },
        { id: 'backend', x: 75, y: 38, icon: <Server className="w-5 h-5" />, label: 'ALPARSLAN', status: path.clientToBackend },
        { id: 'internet', x: 25, y: 62, icon: <Wifi className="w-5 h-5" />, label: 'World', status: path.backendToInternet },
        { id: 'youtube', x: 75, y: 85, icon: <Activity className="w-5 h-5" />, label: 'YouTube', status: path.backendToYouTube },
    ];

    const nodes = isMobile ? mobileNodes : desktopNodes;

    // Helper for organic curved paths
    const getCurvedPath = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
        if (!isMobile) {
            const cp1x = p1.x + (p2.x - p1.x) / 2;
            const cp1y = p1.y + 8;
            return `M ${p1.x} ${p1.y} Q ${cp1x} ${cp1y} ${p2.x} ${p2.y}`;
        } else {
            const cp1x = p2.x;
            const cp1y = p1.y + (p2.y - p1.y) / 2;
            return `M ${p1.x} ${p1.y} Q ${cp1x} ${cp1y} ${p2.x} ${p2.y}`;
        }
    };

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full max-h-[500px] overflow-visible" preserveAspectRatio="xMidYMid meet">
            <defs>
                <filter id="auraBlur" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Connection Paths */}
            {nodes.slice(0, -1).map((node, i) => {
                const nextNode = nodes[i + 1];
                const isActive = nextNode.status;
                const pathD = getCurvedPath(node, nextNode);
                const strokeColor = isActive ? "hsl(var(--success))" : "hsl(var(--destructive))";

                return (
                    <g key={`path-${node.id}`}>
                        <path
                            d={pathD}
                            stroke={strokeColor}
                            strokeWidth="0.6"
                            strokeOpacity="0.1"
                            fill="none"
                        />
                        {isActive && (
                            <>
                                <path
                                    d={pathD}
                                    stroke={strokeColor}
                                    strokeWidth="1.2"
                                    fill="none"
                                    className="animate-glowing-streak"
                                    filter="url(#auraBlur)"
                                    strokeOpacity="0.4"
                                />
                                <path
                                    d={pathD}
                                    stroke={strokeColor}
                                    strokeWidth="0.6"
                                    fill="none"
                                    className="animate-glowing-streak-slow"
                                    strokeOpacity="0.2"
                                />
                            </>
                        )}
                    </g>
                );
            })}

            {/* Nodes */}
            {nodes.map((node) => (
                <PremiumAuraNode
                    key={node.id}
                    x={node.x}
                    y={node.y}
                    icon={node.icon}
                    label={node.label}
                    active={node.status}
                />
            ))}
        </svg>
    );
}

function PremiumAuraNode({ x, y, icon, label, active }: { x: number; y: number; icon: React.ReactNode; label: string; active: boolean }) {
    const themeColor = active ? "hsl(var(--success))" : "hsl(var(--destructive))";

    return (
        <g className="group cursor-default">
            {active && (
                <circle
                    cx={x}
                    cy={y}
                    r="8"
                    fill={themeColor}
                    fillOpacity="0.1"
                    className="animate-aura-pulse"
                />
            )}

            <circle
                cx={x}
                cy={y}
                r="5.5"
                fill="hsl(var(--card))"
                stroke={themeColor}
                strokeWidth="0.4"
                strokeOpacity={active ? "0.8" : "0.3"}
                className="transition-all duration-700"
            />

            <foreignObject x={x - 2.8} y={y - 2.8} width="5.6" height="5.6">
                <div className={cn(
                    "w-full h-full flex items-center justify-center transition-all duration-700",
                    active ? "text-green-500" : "text-muted-foreground/60"
                )}>
                    {icon}
                </div>
            </foreignObject>

            <circle
                cx={x + 3.8}
                cy={y - 3.8}
                r="0.8"
                fill={themeColor}
                stroke="hsl(var(--card))"
                strokeWidth="0.2"
            />

            <text
                x={x}
                y={y + 11}
                textAnchor="middle"
                className={cn(
                    "text-[2.2px] font-bold uppercase tracking-[0.25em] transition-colors duration-700",
                    active ? "fill-foreground" : "fill-muted-foreground/40"
                )}
            >
                {label}
            </text>
        </g>
    );
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, '0');

    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    const year = d.getFullYear();

    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hoursStr = pad(hours);
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());

    return `${month}/${day}/${year}, ${hoursStr}:${minutes}:${seconds} ${ampm}`;
}

function CodecBadge({ label, supported }: { label: string; supported: boolean }) {
    return (
        <span className={cn(
            "text-[9px] px-1.5 py-0.5 rounded font-bold border",
            supported ? "bg-green-500/10 border-green-500/20 text-green-700" : "bg-red-500/10 border-red-500/20 text-red-700"
        )}>
            {label}: {supported ? 'READY' : 'MISSING'}
        </span>
    );
}

function VersionRow({ label, value }: { label: string; value: string }) {
    const isMissing = value === 'Not detected';
    return (
        <div className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <span className={cn("text-sm font-mono", isMissing ? "text-destructive" : "text-foreground")}>
                {value}
            </span>
        </div>
    );
}

function HealthRow({ label, status }: { label: string; status: boolean }) {
    return (
        <div className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            {status ? (
                <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                    <CheckCircle2 className="w-3 h-3" /> OK
                </span>
            ) : (
                <span className="flex items-center gap-1.5 text-xs text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                    <XCircle className="w-3 h-3" /> Fail
                </span>
            )}
        </div>
    );
}
