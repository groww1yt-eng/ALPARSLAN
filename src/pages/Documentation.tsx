import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Check, Copy, Download, Layers, Shield, Sparkles, Terminal, Video, Zap, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUIStore } from '@/store/useUIStore';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

// Reusable Code Block with Copy Button
const CodeBlock = ({ code, language = 'bash' }: { code: string, language?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-border/50 bg-secondary/30">
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border/50">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{language}</span>
        <button 
          onClick={handleCopy}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <code className="font-mono text-sm text-foreground/90 whitespace-pre">
          {code}
        </code>
      </div>
    </div>
  );
};

// Mock documentation sections
const SECTIONS = [
  { id: 'getting-started', title: 'Getting Started', icon: BookOpen },
  { id: 'installation', title: 'Installation', icon: Download },
  { id: 'cli-usage', title: 'CLI Commands', icon: Terminal },
  { id: 'media-extraction', title: 'Media Extraction', icon: Video },
  { id: 'security', title: 'Security & Privacy', icon: Shield },
  { id: 'premium-features', title: 'Premium Features', icon: Sparkles },
];

const CONTENT_MAP: Record<string, React.ReactNode> = {
  'getting-started': (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <div className="p-6 rounded-2xl border border-border/50 bg-secondary/20 shadow-inner mb-8 mt-6">
        <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-primary" /> Initial Setup
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          ALPARSLAN relies on a powerful local Rust backend to process media streams. Make sure you have the core dependencies installed before attempting an extraction. You will need Node.js and npm available in your system path.
        </p>
        <CodeBlock code="npm install -g alparslan-cli" />
        <p className="text-muted-foreground text-sm leading-relaxed mt-4">
          Once installed globally, you can verify the installation by checking the exposed version number directly from your terminal.
        </p>
        <CodeBlock code="alparslan --version" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight mt-10 mb-4 border-b border-border/40 pb-2">Core Concepts</h2>
      <p className="text-muted-foreground leading-relaxed mb-6">
        Unlike traditional cloud extraction tools, ALPARSLAN processes the majority of logic entirely locally. This means your data never touches our servers. The heavy lifting is done using FFmpeg WASM arrays directly in your active browser memory, preserving exact 1:1 bitstream fidelity without forced sever-side recompression.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <div className="p-5 rounded-xl border border-border/50 bg-background shadow-sm hover:shadow-md transition-shadow">
          <Video className="w-6 h-6 text-primary mb-3" />
          <h4 className="font-semibold mb-2">4K Processing</h4>
          <p className="text-sm text-muted-foreground">Maintains exactly 1:1 pixel accuracy on all container formats. We bypass generic transcoding when the raw stream is available.</p>
        </div>
        <div className="p-5 rounded-xl border border-border/50 bg-background shadow-sm hover:shadow-md transition-shadow">
          <Shield className="w-6 h-6 text-success mb-3" />
          <h4 className="font-semibold mb-2">End-to-End Encryption</h4>
          <p className="text-sm text-muted-foreground">Every outgoing request is AES-256 patched by default to hide metadata from your ISP.</p>
        </div>
      </div>
    </div>
  ),
  'installation': (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <h2 className="text-2xl font-bold tracking-tight mt-6 mb-4 border-b border-border/40 pb-2">System Requirements</h2>
      <p className="text-muted-foreground leading-relaxed mb-4">Before proceeding with the installation, ensure your host machine meets the following physical criteria:</p>
      <ul className="text-muted-foreground leading-relaxed mb-8 list-disc pl-5 space-y-2">
        <li><strong>Node.js:</strong> v18.0.0 or higher. We recommend using `nvm` to manage node deployments.</li>
        <li><strong>FFmpeg:</strong> Installed and available globally in your system path. The ALPARSLAN core relies on this binaries for heavy lifting.</li>
        <li><strong>Memory:</strong> At least 4GB of available RAM for 4K video rendering. 8GB recommended for parallel batch extractions.</li>
        <li><strong>Network:</strong> A stable broadband connection. Unstable connections may cause fragmented WASM chunks.</li>
      </ul>
      <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
        <Download className="w-5 h-5 text-primary" /> Quick Install
      </h3>
      <p className="text-muted-foreground mb-4">Run the following command in your terminal to install the ALPARSLAN suite globally across your system:</p>
      <CodeBlock code="npm install -g alparslan-cli" />
      <p className="text-muted-foreground mb-4 mt-6">If you are using a Linux or MacOS environment, you may need to run this command with `sudo` permissions, or alternatively use `npx` for a sandbox execution:</p>
      <CodeBlock code="npx alparslan-cli extract <url>" />
    </div>
  ),
  'cli-usage': (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <h2 className="text-2xl font-bold tracking-tight mt-6 mb-4 border-b border-border/40 pb-2">Basic Commands</h2>
      <p className="text-muted-foreground leading-relaxed mb-6">ALPARSLAN includes a powerful CLI for automation. You can integrate these scripts directly into your CI/CD pipelines or bash utilities.</p>
      
      <div className="space-y-8">
        <div className="p-5 rounded-xl border border-border/50 bg-background shadow-sm">
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-lg">
            <Terminal className="w-5 h-5 text-primary" /> Extract Video (Highest Quality)
          </h4>
          <p className="text-sm text-muted-foreground mb-3">Extracts the absolute highest quality video stream available and automatically merges it with the highest quality audio stream using FFmpeg, forcing an MP4 container output.</p>
          <CodeBlock code="alparslan extract https://youtube.com/watch?v=XXXXX -f mp4 --quality 4k" />
        </div>
        
        <div className="p-5 rounded-xl border border-border/50 bg-background shadow-sm">
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-lg">
            <Terminal className="w-5 h-5 text-primary" /> Extract Audio Only
          </h4>
          <p className="text-sm text-muted-foreground mb-3">Targets purely the audio datastream, entirely ignoring video packets to save bandwidth. Automatically normalizes audio levels and converts to 320kbps MP3.</p>
          <CodeBlock code="alparslan extract https://youtube.com/watch?v=XXXXX -f mp3 --audio-only" />
        </div>

        <div className="p-5 rounded-xl border border-border/50 bg-background shadow-sm">
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-lg">
            <Terminal className="w-5 h-5 text-primary" /> Batch Playlist Extraction
          </h4>
          <p className="text-sm text-muted-foreground mb-3">Downloads entire playlists sequentially. Use the `--concurrent` flag only if you hold a Premium license to avoid IP rate-limiting.</p>
          <CodeBlock code="alparslan extract https://youtube.com/playlist?list=XXXXX --playlist --start 1 --end 50" />
        </div>
      </div>
    </div>
  ),
  'media-extraction': (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <h2 className="text-2xl font-bold tracking-tight mt-6 mb-4 border-b border-border/40 pb-2">Supported Platforms</h2>
      <p className="text-muted-foreground leading-relaxed mb-6">The extraction engine supports over 1000+ websites. If it plays video, ALPARSLAN can likely extract it.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {['YouTube', 'Vimeo', 'Twitter / X', 'Twitch', 'Facebook', 'TikTok'].map((platform) => (
          <div key={platform} className="flex items-center gap-2 p-3 bg-secondary/20 rounded-xl border border-border/30 shadow-sm">
            <Video className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{platform}</span>
          </div>
        ))}
      </div>
      <div className="p-5 bg-primary/10 border border-primary/20 rounded-xl">
        <h4 className="font-semibold mb-2 text-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Pro Tip
        </h4>
        <p className="text-sm text-muted-foreground">When extracting playlists, use the <code className="bg-background px-1.5 py-0.5 border border-border/50 font-mono rounded text-foreground text-xs">--playlist-start</code> and <code className="bg-background px-1.5 py-0.5 border border-border/50 font-mono rounded text-foreground text-xs">--playlist-end</code> flags to target specific ranges instead of the full queue.</p>
      </div>
    </div>
  ),
  'security': (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <h2 className="text-2xl font-bold tracking-tight mt-6 mb-4 border-b border-border/40 pb-2">Our Security Promise</h2>
      <p className="text-muted-foreground leading-relaxed mb-8">ALPARSLAN is built fundamentally around privacy-first architecture.</p>
      
      <div className="space-y-6">
        <div className="flex gap-4 p-6 rounded-2xl border border-border/50 bg-secondary/10 shadow-sm hover:shadow-md transition-all">
          <Shield className="w-8 h-8 text-success flex-shrink-0" />
          <div>
            <h4 className="font-semibold mb-1 text-lg">Zero Telemetry</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">ALPARSLAN collects absolutely zero analytics, usage data, or extraction history. Your logs remain completely local to your machine permanently.</p>
          </div>
        </div>
        <div className="flex gap-4 p-6 rounded-2xl border border-border/50 bg-secondary/10 shadow-sm hover:shadow-md transition-all">
          <Shield className="w-8 h-8 text-success flex-shrink-0" />
          <div>
            <h4 className="font-semibold mb-1 text-lg">Local Processing</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">We compile FFmpeg directly to WebAssembly (WASM). This means video merging and conversion happens inside your browser's memory sandbox, not on a remote server.</p>
          </div>
        </div>
      </div>
    </div>
  ),
  'premium-features': (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <div className="flex items-center gap-4 mb-6 mt-6">
        <div className="p-3 bg-primary/20 text-primary rounded-xl shadow-inner border border-primary/20">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight m-0 text-foreground">ALPARSLAN Pro</h2>
      </div>
      <p className="text-muted-foreground leading-relaxed mb-8 text-lg">
        Unlock the ultimate extraction experience with our premium tier.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5 relative overflow-hidden group hover:bg-primary/10 transition-colors">
          <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-primary/20 rounded-full blur-[60px] group-hover:bg-primary/30 transition-colors"></div>
          <h4 className="font-semibold mb-3 text-lg flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" /> Batch Processing
          </h4>
          <p className="text-sm text-muted-foreground relative z-10">Extract up to 50 URLs concurrently with intelligent rate-limit circumvention and dynamic queue management.</p>
        </div>
        <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5 relative overflow-hidden group hover:bg-primary/10 transition-colors">
          <div className="absolute bottom-[-50%] left-[-50%] w-full h-full bg-primary/20 rounded-full blur-[60px] group-hover:bg-primary/30 transition-colors"></div>
          <h4 className="font-semibold mb-3 text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> 8K HDR Support
          </h4>
          <p className="text-sm text-muted-foreground relative z-10">Unlock ultra-high definition extraction for supported platforms without downgrading advanced video codecs.</p>
        </div>
      </div>
    </div>
  )
};

export default function Documentation() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const { theme } = useUIStore();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-x-hidden w-full max-w-[100vw]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 h-16 w-full bg-background/80 backdrop-blur-md border-b border-border/50 flex items-center px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 group cursor-pointer mr-8">
          <img 
            src={theme === 'dark' ? '/logo_dark.png' : '/logo_light.png'} 
            alt="ALPARSLAN Logo" 
            className="h-6 md:h-7 w-auto group-hover:scale-105 transition-transform duration-300" 
          />
          <span className="font-black text-xl md:text-2xl tracking-tighter text-foreground translate-y-[1px]">
            ALPARSLAN
          </span>
        </Link>
        <div className="h-6 w-px bg-border mx-4 hidden md:block"></div>
        <span className="text-sm font-semibold text-muted-foreground hidden md:block">Documentation</span>
        
        <div className="ml-auto flex items-center gap-2 md:gap-4 shrink-0">
          <Link to="/">
            <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 sm:gap-2 mr-1 md:mr-0 p-1.5 md:p-0 rounded-md">
              <ArrowLeft className="w-5 h-5 md:w-4 md:h-4" /> <span className="hidden sm:inline">Back to Home</span>
            </button>
          </Link>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle className="text-left font-black tracking-tighter text-xl text-foreground">Documentation</SheetTitle>
              </SheetHeader>
              <nav className="space-y-1 mt-6">
                {SECTIONS.map((section) => (
                  <SheetTrigger asChild key={section.id}>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeSection === section.id 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                      }`}
                    >
                      <section.icon className="w-4 h-4" />
                      {section.title}
                    </button>
                  </SheetTrigger>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="flex flex-1 container max-w-[100vw] mx-auto w-full">
        {/* Sidebar Navigation */}
        <aside className="hidden md:block shrink-0 w-64 border-r border-border/40 py-8 pr-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="space-y-1">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeSection === section.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}
              >
                <section.icon className="w-4 h-4" />
                {section.title}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 w-full py-6 md:py-8 md:px-6 md:pl-12 max-w-4xl">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
              <BookOpen className="w-3.5 h-3.5" /> Official Guide
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              {SECTIONS.find(s => s.id === activeSection)?.title}
            </h1>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-2xl">
              Learn how to leverage the full power of ALPARSLAN's extraction engine. Master workflows, configure settings, and maximize performance.
            </p>

            {/* Dynamic Content Markdown Placeholder */}
            <div key={activeSection} className="animate-fade-in">
              {CONTENT_MAP[activeSection] || (
                <div className="p-8 text-center text-muted-foreground border border-border/50 rounded-2xl bg-secondary/10">
                  Select a section from the sidebar to view its documentation.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
