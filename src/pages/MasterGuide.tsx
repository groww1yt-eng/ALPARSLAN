import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  LayoutDashboard, 
  Download, 
  History, 
  Settings, 
  ShieldCheck, 
  Zap, 
  Info,
  ArrowRight,
  ChevronRight,
  Lightbulb,
  Shield,
  Cpu,
  Globe,
  Lock,
  ExternalLink,
  Save,
  Trash2,
  FileCode,
  HardDrive,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, ReactNode } from 'react';

function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-2 px-2 py-0.5 rounded-md font-mono text-[10px] transition-all",
        "bg-muted border border-border/50 text-muted-foreground hover:text-foreground hover:bg-accent",
        copied && "bg-green-500/10 border-green-500/20 text-green-600"
      )}
      title="Click to copy"
    >
      {code}
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 mx-0.5 rounded bg-muted border border-border/40 text-muted-foreground font-mono text-[11px] font-medium leading-none">
      {children}
    </code>
  );
}

export default function MasterGuide() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const sections = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      color: 'blue',
      description: 'Your primary workspace for media analysis and extraction initiation.',
      details: [
        {
          heading: 'URL Intelligence',
          content: (
            <span>
              The engine performs real-time sanitization of URLs. It strips tracking parameters (like <Code>?si=</Code> or <Code>&t=</Code>) to ensure the request is clean. It automatically detects if a link is a single video or a playlist, unlocking adaptive controls.
            </span>
          ),
          usage: 'Just paste and wait; the engine handles the analysis in the background.'
        },
        {
          heading: 'Advanced Extraction Matrix',
          content: 'Choose between "Video + Audio" for a complete archive or "Audio Only" for portability. Resolutions scale from 360p to 4K (2160p). High-bitrate streams are automatically merged locally using FFmpeg for zero quality loss.',
          usage: 'Use 1080p for a balance of speed and quality; 4K is reserved for archival purposes.'
        },
        {
          heading: 'Playlist Power-Tools',
          content: 'Manage bulk downloads with precision. Use "Range" (e.g., 5-15) to grab specific segments, or the "Visual Picker" to manually select highlight videos from a large list. The app manages memory efficiently even for 500+ video lists.',
          usage: 'Perfect for downloading entire series or specific episodes without manual selection.'
        },
        {
          heading: 'Naming Power-Tools (Verified Tags)',
          content: 'ALPARSLAN allows for 100% custom filenames using dynamic tags. These tags are replaced at runtime with actual metadata from the source.',
          tags: [
            { name: '<title>', desc: 'The exact title of the video/audio.' },
            { name: '<index>', desc: 'The position in a playlist (Required for Playlists).' },
            { name: '<quality>', desc: 'The resolution, e.g., 1080p (Required for Video mode).' },
            { name: '<channel>', desc: 'The creator or uploader name.' },
            { name: '<date>', desc: 'Current download date (DD-MM-YYYY).' },
            { name: '<format>', desc: 'The output file extension (mp3, mp4, etc.).' }
          ],
          usage: 'Playlists MUST include <index> to prevent files from overwriting each other.'
        },
        {
          heading: 'Filename Sanitization',
          content: 'Operating systems have strict rules for filenames. ALPARSLAN automatically detects and replaces invalid characters (< > : " | ? * \\ /) with underscores (_) to ensure your files are always compatible with Windows and Android.',
          usage: 'Your titles are safe; "Top 10: Best Videos?" becomes "Top 10_ Best Videos_".'
        }
      ]
    },
    {
      id: 'active-jobs',
      title: 'Active Jobs',
      icon: Download,
      color: 'emerald',
      description: 'Real-time monitoring and lifecycle management for your extractions.',
      details: [
        {
          heading: 'The Extraction Lifecycle',
          content: 'Jobs follow a strict four-stage path: Queued (waiting for resources) -> Downloading (network active) -> Converting (FFmpeg Merging) -> Completed.',
          usage: 'During "Converting", your CPU usage will spike while your Network drops to 0. This is normal high-quality merging.'
        },
        {
          heading: 'Live Metrics & ETAs',
          content: 'We provide granular speeds in MB/s. The ETA is dynamic; it recalculates every second based on your current network stability.',
          usage: 'If the ETA shows --:--, the engine is calculating bit-depth or verifying fragments.'
        },
        {
          heading: 'Lifecycle Control',
          content: 'Total command over background processes. Pause a heavy 4K job to free up bandwidth for a video call. Canceling a job instantly purges temporary fragments to keep your disk clean.',
          usage: 'Pause/Resume is your best friend on shared or limited internet connections.'
        }
      ]
    },
    {
      id: 'history',
      title: 'History',
      icon: History,
      color: 'orange',
      description: 'A persistent, locally-stored log of every extraction you’ve performed.',
      details: [
        {
          heading: 'Persistent Auditing',
          content: 'Every log entry stores the resolution, final file size, and the exact path where the file was saved. This database survives app restarts and updates.',
          usage: 'Use the "Open Folder" shortcut to verify your library without manual searching.'
        },
        {
          heading: 'Deletion Logic',
          content: 'Safety First: Clicking the "Delete" icon in History only removes the record from ALPARSLAN. It DOES NOT delete the physical file from your hard drive.',
          usage: 'Clean your logs often to keep the UI snappy without losing any media.'
        }
      ]
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      color: 'purple',
      description: 'The orchestration hub for your application behavior.',
      details: [
        {
          heading: 'The Draft System',
          content: 'Settings use a "Draft-First" approach. You can tweak multiple values without them taking effect immediately. You must click "Save" to commit changes to the backend.',
          usage: 'If you try to navigate away with unsaved changes, the app will trigger a safety confirmation.'
        },
        {
          heading: 'OS-Specific Output Folder',
          content: 'The app intelligently detects your OS for default pathing: Windows defaults to your Downloads/ALP folder, while Android targets /storage/emulated/0/ALP/.',
          usage: 'Always use absolute paths when customizing your output folder.'
        },
        {
          heading: 'Session Locking',
          content: 'To prevent file corruption, critical settings (Output Folder, Mode, Quality) are locked and become "Read-Only" while ANY download is active.',
          usage: 'Ensure your settings are perfect before hitting the download button on a massive playlist.'
        },
        {
          heading: 'Auto-Organization',
          content: 'Enable "Per-Channel Folders" to have the app automatically create sub-directories based on the creator’s name. This eliminates manual sorting.',
          usage: 'Ideal for music lovers and podcast collectors who want an organized library.'
        }
      ]
    },
    {
      id: 'compatibility',
      title: 'Diagnostics & Security',
      icon: ShieldCheck,
      color: 'cyan',
      description: 'Professional tools for secure extraction and network management.',
      details: [
        {
          heading: 'Cookies & Restricted Content',
          content: 'YouTube blocks anonymous requests for age-restricted or private content. By importing your cookies.txt, the app "behaves like you", allowing access to member-only videos and your personal bookmarks.',
          usage: 'Never share your cookies.txt file; it contains your session identity.'
        },
        {
          heading: 'Proxy & Reputation',
          content: 'Bypass ISP Throttling: If your ISP limits speeds on media sites, a Proxy shifts your IP to a fast, unrestricted node. Reputation checks (Clean/Blocked/Throttled) tell you if your current IP is being rate-limited by the source.',
          usage: 'Check the connectivity status on this page to ensure your proxy is active and healthy.'
        },
        {
          heading: 'DNS & Latency Health',
          content: 'The engine measures DNS response times in milliseconds. A "Slow" or "Fail" status can cause "Link Analysis" to time out. High latency often indicates a DNS hijack or an unstable VPN node.',
          usage: 'If analysis is slow, try switching to a public DNS like 1.1.1.1 or 8.8.8.8.'
        },
        {
          heading: 'FFmpeg Codec Verification',
          content: 'High-quality merging requires specific library support. The app audits your local FFmpeg for MP3, AAC, and H.264 "READY" status. If a codec is missing, conversion to those formats will fail.',
          usage: 'Ensure you have the "Complete" version of FFmpeg installed, not the "Essentials" build.'
        },
        {
          heading: 'yt-dlp Maintenance Hub',
          content: (
            <span>
              The underlying extraction engine needs occasional care. Click to copy and run <CopyableCode code="yt-dlp -U" /> via your terminal to get the latest site-compatibility fixes. Use <CopyableCode code="--rm-cache-dir" /> to fix metadata errors.
            </span>
          ),
          usage: 'Most "Signature Cipher" errors can be fixed simply by running the update command.'
        },
        {
          heading: 'Write Permission Audit',
          content: 'Before every extraction, the app performs a silent check on your Output Folder. If "Write Access" is false, downloads will fail instantly to prevent data loss.',
          usage: 'On Windows, ensure "Read-only" is unchecked for your target folder properties.'
        }
      ]
    }
  ];
    return (
    <div className="flex-1 overflow-y-auto bg-background selection:bg-primary/20">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        
        {/* Header Section */}
        <header className="space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border/40 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mx-auto">
            <BookOpen className="w-3 h-3" /> Documentation
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Getting Started</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              The definitive handbook for ALPARSLAN. Learn how to master the engine, secure your network, and optimize your local media workflow.
            </p>
          </div>
        </header>

        {/* Philosophy Hub - Simplified */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border border-border/50 bg-card/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Zap className="w-4 h-4 text-orange-500" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Local-First Engine</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Unlike cloud-based converters, ALPARSLAN processes everything locally. Your URLs, metadata, and video packets are handled directly on your hardware, ensuring <strong>absolute privacy</strong>.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border/50 bg-card/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Security Protocol</h2>
            </div>
            <ul className="space-y-2">
              {[
                'Zero Telemetry: No usage tracking, ever.',
                'Sandbox Extraction: Isolated local runtime.',
                'ISP Cloaking: Mimics standard browser traffic.'
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <div className="w-1 h-1 rounded-full bg-primary/60" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Interactive Deep Dive */}
        <div className="space-y-12">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl font-black tracking-tight text-foreground tracking-[0.1em]">System Explorer</h2>
            <p className="text-muted-foreground text-sm mt-3 max-w-lg leading-relaxed">
              Deep dive into the engine’s core modules and advanced extraction logic.
            </p>
            
            <div className="inline-flex p-1 bg-muted/40 backdrop-blur-sm rounded-xl border border-border/40 shadow-inner mt-10">
              <div className="flex flex-wrap justify-center gap-1">
                {sections.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveTab(s.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300",
                        activeTab === s.id 
                          ? "bg-background text-primary shadow-sm border border-border/40 scale-105" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className={cn(
                        "w-3.5 h-3.5 transition-colors",
                        activeTab === s.id ? "text-primary" : "text-muted-foreground/60"
                      )} />
                      {s.title}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {sections.filter(s => s.id === activeTab).map((section) => (
              <div key={section.id} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {section.details.map((detail, idx) => (
                    <div key={idx} className="group p-6 rounded-xl bg-card border border-border/40 hover:border-primary/20 transition-all duration-300 shadow-sm">
                      <h4 className="text-base font-bold flex items-center gap-2 mb-4">
                        <ChevronRight className="w-4 h-4 text-primary/60" />
                        {detail.heading}
                      </h4>
                      <div className="text-sm text-muted-foreground leading-relaxed pl-6">
                        {detail.content}
                      </div>

                      {/* Optional Tags list */}
                      {detail.tags && (
                        <div className="pl-6 flex flex-wrap gap-2 mt-4">
                          {detail.tags.map((tag, tIdx) => (
                            <span key={tIdx} className="px-2 py-0.5 bg-muted border border-border/40 rounded text-[10px] font-mono text-muted-foreground" title={tag.desc}>
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Integrated Pro Tip */}
                      <div className="mt-6 pl-6">
                        <div className="border-l-2 border-primary/20 pl-4 py-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-1">
                            <Zap className="w-3 h-3" /> Pro Tip
                          </div>
                          <p className="text-[13px] text-muted-foreground italic leading-relaxed">
                            {detail.usage}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Specification Grid */}
        <section className="space-y-8 pt-16 border-t border-border/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">System Specification</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: FileCode, title: 'FFmpeg Engine', desc: 'Version 6.0+ integrated for multi-stream muxing.', color: 'text-blue-500' },
              { icon: HardDrive, title: 'Architecture', desc: 'Node.js backend with local Zustand persistence.', color: 'text-emerald-500' },
              { icon: Globe, title: 'Connectivity', desc: 'Adaptive retries with middle-man proxy support.', color: 'text-purple-500' }
            ].map((spec, i) => (
              <div key={i} className="p-5 rounded-xl border border-border/40 bg-card/30 space-y-3">
                <spec.icon className={cn("w-4 h-4", spec.color)} />
                <h4 className="text-sm font-bold">{spec.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{spec.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <footer className="pt-24 pb-12 text-center space-y-8">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight">Ready to begin?</h3>
            <p className="text-sm text-muted-foreground font-medium">Head back to the dashboard to start your next extraction.</p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-foreground text-background font-bold text-sm hover:translate-y-[-2px] transition-all shadow-lg"
          >
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </footer>

      </div>
    </div>
  );
}
