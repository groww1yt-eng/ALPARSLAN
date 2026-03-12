import { Github, Info, Twitter, Code2, Globe, Cpu, ShieldCheck, Zap, Database, Server } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';

export default function About() {
  const { theme } = useUIStore();
  
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 pb-8 border-b border-border/50">
          <div className="p-4 bg-primary/10 rounded-3xl shrink-0">
            <img 
              src={theme === 'dark' ? '/logo_dark.png' : '/logo_light.png'} 
              alt="ALPARSLAN Logo" 
              className="w-20 h-20 object-contain hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center justify-center md:justify-start gap-2">
              ALPARSLAN <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider translate-y-[-2px]">v2.1.0</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-4 max-w-xl">
              The ultimate high-fidelity media extraction layer designed around WASM-infused speed, security, and absolute precision.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <a href="#" className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-border/50">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-border/50">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors border border-border/50">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl border border-border/50 bg-secondary/20 hover:bg-secondary/30 transition-colors">
            <Code2 className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Open Architecture</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Built on transparent protocols utilizing Node.js and local FFmpeg integrations, ensuring your extractions are never throttled or secretly logged by remote servers.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-border/50 bg-secondary/20 hover:bg-secondary/30 transition-colors">
            <ShieldCheck className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              ALPARSLAN processes all media streams locally. No data is sent to external proprietary servers for conversion, maintaining absolute privacy for your media workflow.
            </p>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary" /> Technology Stack
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Zap, title: "Vite + React", desc: "For a blazing fast and ultra-responsive User Interface." },
              { icon: Database, title: "Zustand", desc: "State management that ensures consistent data across the app." },
              { icon: Server, title: "Node.js", desc: "Powering the backend extraction logic with stability." },
              { icon: Code2, title: "yt-dlp", desc: "The gold standard for media metadata and extraction." },
              { icon: Cpu, title: "FFmpeg", desc: "For high-performance media transcoding and merging." },
              { icon: ShieldCheck, title: "Tailwind CSS", desc: "Crafting a premium, consistent visual identity." }
            ].map((tech, i) => (
              <div key={i} className="p-5 rounded-xl border border-border/50 bg-secondary/10 flex flex-col gap-3">
                <tech.icon className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{tech.title}</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">{tech.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Architecture Section */}
        <div className="p-8 rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 to-secondary/5 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">The Extraction Layer</h2>
          <p className="text-muted-foreground leading-relaxed">
            Unlike traditional web-based downloaders that rely on centralized servers to process your requests, 
            <strong> ALPARSLAN</strong> operates on a decentralized principal. All extraction instructions are 
            compiled and executed directly on your host machine.
          </p>
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1 bg-primary/20 rounded-full">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              </div>
              <p className="text-sm text-foreground/80 italic">
                "Our mission is to provide a professional-grade tool that respects user privacy while delivering the highest possible media fidelity."
              </p>
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="pt-8 border-t border-border/50">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive">
            <Info className="w-5 h-5 shrink-0" />
            <p className="text-xs font-medium leading-relaxed">
              ALPARSLAN is an open-source tool designed for educational and personal archival purposes. We do not host or distribute media. Users are responsible for complying with local copyright laws and service terms.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
