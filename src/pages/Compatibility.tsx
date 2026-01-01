import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config';
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
    Activity
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
}

export default function Compatibility() {
    const [info, setInfo] = useState<SystemInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useAppStore();

    const fetchSystemInfo = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/system-info`);
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

    useEffect(() => {
        fetchSystemInfo();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        addNotification({ type: 'success', title: 'Copied', message: 'Instructions copied to clipboard' });
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

            {/* API Check */}
            <div className={cn("border rounded-xl p-5 shadow-sm", info.versions.backend === 'v1.0.0' ? "bg-card" : "bg-destructive/10 border-destructive")}>
                <div className="flex items-center gap-2 mb-2">
                    <Server className="w-5 h-5" />
                    <h2 className="font-semibold text-lg">API Compatibility</h2>
                </div>
                {info.versions.backend === 'v1.0.0' ? (
                    <p className="text-muted-foreground text-sm">Frontend and Backend versions match (v1.0.0).</p>
                ) : (
                    <div className="sm:flex items-start gap-3 mt-2">
                        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-destructive">Version Mismatch Detected</p>
                            <p className="text-sm mt-1">Frontend expects v1.0.0 but Backend is {info.versions.backend}. Please update your server.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Updates */}
            <div className="bg-card border rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-lg">Available Updates</h2>
                    </div>
                    {info.updates.ytdlp.available && (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-medium dark:bg-yellow-900/30 dark:text-yellow-400">
                            Update Available
                        </span>
                    )}
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">yt-dlp</h3>
                    <div className="flex items-center gap-8 text-sm text-muted-foreground mb-4">
                        <div>Current: <span className="text-foreground font-mono">{info.updates.ytdlp.current || 'Unknown'}</span></div>
                        <div>Latest: <span className="text-foreground font-mono">{info.updates.ytdlp.latest || 'Checking...'}</span></div>
                    </div>

                    {info.updates.ytdlp.available ? (
                        <div className="space-y-4">
                            <div className="flex items-start gap-2 text-sm bg-background p-3 rounded border">
                                <Terminal className="w-4 h-4 mt-1 text-muted-foreground" />
                                <div className="flex-1">
                                    <p className="font-medium mb-1">Option 1: Update via command line</p>
                                    <code className="bg-muted px-2 py-0.5 rounded text-xs">yt-dlp -U</code>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard('yt-dlp -U')}>
                                    <Copy className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-green-600 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Up to date
                        </p>
                    )}
                </div>
            </div>
        </div>
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
