import { Link } from 'react-router-dom';
import { ArrowRight, Video, Music, Zap, Download, Layers, Shield, Sparkles, CheckCircle2, Link2, Settings, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useUIStore } from '@/store/useUIStore';

// Custom Animated Background Component
const AnimatedBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
    <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-accent/10 rounded-full blur-[100px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
    
    {/* Grid Overlay */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
    
    {/* Vignette */}
    <div className="absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
  </div>
);

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const { theme } = useUIStore();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-x-hidden relative selection:bg-primary/30">
      <AnimatedBackground />

      {/* Sticky Header */}
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
          scrolled 
            ? "h-16 bg-background/80 backdrop-blur-xl border-border/50 shadow-lg shadow-black/5" 
            : "h-20 bg-transparent border-transparent"
        )}
      >
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <img 
              src={theme === 'dark' ? '/logo_dark.png' : '/logo_light.png'} 
              alt="ALPARSLAN Logo" 
              className="h-6 md:h-7 w-auto group-hover:scale-105 transition-transform duration-300" 
            />
            <span className="font-black text-xl md:text-2xl tracking-tighter text-foreground translate-y-[1px]">
              ALPARSLAN
            </span>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6">
            <button className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-2">
              Features
            </button>
            <button className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-2">
              How it Works
            </button>
            <div className="w-px h-6 bg-border/50 hidden sm:block mx-1"></div>
            <button className="text-sm font-medium text-foreground hover:text-primary transition-colors px-3 py-2">
              Log In
            </button>
            <button className="text-sm font-semibold bg-foreground text-background hover:bg-foreground/90 px-5 py-2.5 rounded-full shadow-lg transition-all active:scale-95">
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col pt-20">
        
        {/* Dynamic Hero Section */}
        <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 px-6 overflow-hidden">
          <div className="container mx-auto max-w-6xl relative z-10 flex flex-col items-center text-center">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 mb-8 animate-fade-in text-sm font-medium text-primary">
              <Sparkles className="w-4 h-4" />
              <span>ALPARSLAN 2.0 is now live</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-6 md:mb-8 leading-[1.1] animate-fade-in">
              Download Media <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary animate-pulse-slow">
                Without Limits.
              </span>
            </h1>
            
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-8 md:mb-10 max-w-2xl leading-relaxed animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
              Experience the highest fidelity video and audio extraction. Engineered for speed, designed for absolute simplicity.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
              <Link to="/dashboard" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto btn-primary rounded-full flex items-center justify-center gap-2 group text-base md:text-lg px-10 py-4 shadow-primary/30 hover:shadow-primary/40 text-white font-bold">
                  Start Downloading
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link to="/docs" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-10 py-4 rounded-full font-semibold bg-secondary/80 text-foreground hover:bg-secondary border border-border/50 backdrop-blur-md transition-all active:scale-95 flex items-center justify-center gap-2">
                  <BookOpen className="w-5 h-5 text-muted-foreground mr-1" />
                  View Documentation
                </button>
              </Link>
            </div>

            {/* Hero App Preview / Mockup abstraction */}
            <div className="mt-16 md:mt-24 w-full max-w-5xl aspect-square sm:aspect-[4/3] md:aspect-video rounded-xl md:rounded-[2rem] glass p-2 md:p-4 border border-border/40 shadow-2xl shadow-black/50 overflow-hidden relative animate-fade-in group" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
               <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10 pointer-events-none"></div>
               <div className="w-full h-full bg-sidebar/90 rounded-xl md:rounded-3xl border border-border/50 overflow-hidden flex flex-col">
                  {/* Mock Sidebar/Header */}
                  <div className="h-10 md:h-12 border-b border-border/50 flex items-center px-3 md:px-4 gap-2 bg-sidebar shrink-0">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-destructive/80"></div>
                      <div className="w-3 h-3 rounded-full bg-warning/80"></div>
                      <div className="w-3 h-3 rounded-full bg-success/80"></div>
                    </div>
                    <div className="mx-auto flex-1 max-w-[256px] h-6 bg-background rounded-md border border-border/50 text-xs flex items-center px-3 text-muted-foreground overflow-hidden">
                      <span className="truncate">https://youtube.com/watch?v=dQw4w</span>
                    </div>
                  </div>
                  {/* Mock Content */}
                  <div className="flex-1 p-4 md:p-10 flex gap-6">
                    <div className="w-64 hidden md:flex flex-col gap-4">
                      <div className="h-10 bg-primary/20 rounded-lg w-full border border-primary/20 flex items-center px-4 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                        <span className="text-primary font-medium text-sm">Dashboard</span>
                      </div>
                      <div className="h-10 bg-secondary rounded-lg w-full opacity-50"></div>
                      <div className="h-10 bg-secondary rounded-lg w-full opacity-50"></div>
                    </div>
                    <div className="flex-1 flex flex-col gap-4 md:gap-6">
                      <div className="flex-1 md:h-40 w-full bg-secondary/50 rounded-xl border border-border/50 relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                         <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 h-4 md:h-6 w-24 md:w-48 bg-background/80 backdrop-blur rounded-md"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 md:gap-4 shrink-0">
                        <div className="h-16 sm:h-20 md:h-24 bg-secondary/50 rounded-xl border border-border/50"></div>
                        <div className="h-16 sm:h-20 md:h-24 bg-secondary/50 rounded-xl border border-border/50"></div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>

          </div>
        </section>

        {/* Bento Grid Features Section */}
        <section className="py-16 md:py-24 relative">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 tracking-tight">Engineered for Excellence</h2>
              <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
                No compromises. ALPARSLAN delivers a premium experience with robust under-the-hood capabilities.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bento Item 1 - Large */}
              <div className="md:col-span-2 card-elevated p-8 md:p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-colors duration-500"></div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center mb-6 border border-border/50 shadow-sm">
                      <Video className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">Uncompromising 4K Quality</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                      Extract the absolute highest quality video streams available, seamlessly merged with perfect audio sync.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bento Item 2 */}
              <div className="card-elevated p-8 md:p-10 relative overflow-hidden group">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-[50px]"></div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center mb-6 border border-border/50">
                    <Music className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3 tracking-tight">Pristine Audio</h3>
                    <p className="text-muted-foreground">Lossless extraction to MP3, WAV, FLAC, and OPUS formats.</p>
                  </div>
                </div>
              </div>

              {/* Bento Item 3 */}
              <div className="card-elevated p-8 md:p-10 relative overflow-hidden group">
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center mb-6 border border-border/50">
                    <Layers className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3 tracking-tight">Full Playlists</h3>
                    <p className="text-muted-foreground">Batch download entire channels or customized playlist ranges effortlessly.</p>
                  </div>
                </div>
              </div>

              {/* Bento Item 4 - Wide */}
              <div className="md:col-span-2 card-elevated p-8 md:p-10 relative overflow-hidden group">
                {/* Decorative background element for speed */}
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none">
                  <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                    <g className="animate-glowing-streak">
                       <path d="M-100,50 L800,50" stroke="url(#grad1)" strokeWidth="2" fill="none" />
                    </g>
                    <g className="animate-glowing-streak-slow" style={{ animationDelay: '1s' }}>
                       <path d="M-100,150 L800,150" stroke="url(#grad1)" strokeWidth="1" fill="none" />
                    </g>
                    <g className="animate-glowing-streak" style={{ animationDelay: '2.5s' }}>
                       <path d="M-100,200 L800,200" stroke="url(#grad1)" strokeWidth="3" fill="none" />
                    </g>
                  </svg>
                </div>
                
                <div className="relative z-10 h-full flex flex-col justify-between md:flex-row md:items-end w-full">
                  <div className="max-w-md">
                    <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center mb-6 border border-border/50">
                      <Zap className="w-6 h-6 text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 tracking-tight">Blistering Speeds</h3>
                    <p className="text-muted-foreground">
                      Multi-threaded concurrent processing ensures your downloads finish in record time without throttling.
                    </p>
                  </div>
                  <div className="hidden md:block text-5xl lg:text-7xl font-black text-primary/10 translate-y-4 right-0 bottom-0 absolute">
                    FAST
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-16 md:py-24 border-y border-border/30 bg-card/20 relative">
          <div className="container mx-auto px-6 max-w-6xl">
             <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
                <div>
                   <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 tracking-tight">Workflow Simplified</h2>
                   <div className="space-y-8">
                      {/* Step 1 */}
                      <div className="flex gap-4 group">
                         <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">1</div>
                            <div className="w-px h-full bg-border mt-3 group-last:hidden"></div>
                         </div>
                         <div className="pb-8">
                            <h4 className="text-xl font-bold mb-2">Paste the URL</h4>
                            <p className="text-muted-foreground">Simply paste any supported media URL into the dashboard. We instantly fetch all metadata and available qualities.</p>
                         </div>
                      </div>
                      
                      {/* Step 2 */}
                      <div className="flex gap-4 group">
                         <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-secondary border border-border text-foreground font-bold flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">2</div>
                            <div className="w-px h-full bg-border mt-3 group-last:hidden"></div>
                         </div>
                         <div className="pb-8">
                            <h4 className="text-xl font-bold mb-2">Configure Settings</h4>
                            <p className="text-muted-foreground">Select your desired format (Video or Audio) and quality tier. Choose exact playlist ranges if needed.</p>
                         </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex gap-4 group">
                         <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-secondary border border-border text-foreground font-bold flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">3</div>
                         </div>
                         <div>
                            <h4 className="text-xl font-bold mb-2">Download & Enjoy</h4>
                            <p className="text-muted-foreground">Hit download and watch it complete blazing fast. Files are automatically named and organized just how you like them.</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="relative">
                   <div className="aspect-square md:aspect-[4/3] rounded-3xl glass border border-border/50 p-4 md:p-8 flex flex-col justify-center gap-4 md:gap-6 relative overflow-hidden shadow-2xl">
                      {/* Abstract decorative elements */}
                      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-primary/5 to-transparent pointer-events-none"></div>
                      
                      <div className="bg-background border border-border/50 rounded-xl p-4 flex items-center gap-4 shadow-sm relative z-10 hover:border-primary/50 transition-colors w-[95%] md:w-[95%]">
                        <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                          <Link2 className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="h-2 w-2/3 bg-muted rounded-full"></div>
                          <div className="h-2 w-1/3 bg-muted/60 rounded-full"></div>
                        </div>
                      </div>

                      <div className="bg-background border border-border/50 rounded-xl p-4 flex items-center gap-4 shadow-sm relative z-10 translate-x-2 md:translate-x-4 hover:border-accent/50 transition-colors w-[95%] md:w-[95%]">
                        <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                          <Settings className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="h-2 w-1/2 bg-muted rounded-full"></div>
                          <div className="h-2 w-1/4 bg-muted/60 rounded-full"></div>
                        </div>
                      </div>

                      <div className="bg-background border border-border/50 rounded-xl p-4 flex items-center gap-4 shadow-sm relative z-10 translate-x-4 md:translate-x-8 hover:border-success/50 transition-colors w-[95%] md:w-[95%]">
                        <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="h-2 w-3/4 bg-muted rounded-full"></div>
                          <div className="h-2 w-1/2 bg-muted/60 rounded-full"></div>
                        </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* Wide Horizontal CTA Banner */}
        <section className="py-24 relative overflow-hidden z-10 border-y border-border/40 bg-secondary/20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CiAgPHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTIwIDIwaDIwdjIwSDIwVjIweiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjAyIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz4KPC9zdmc+')] opacity-50 pointer-events-none"></div>
          
          {/* Subtle glow specifically for this banner */}
          <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-primary/10 rounded-full blur-[100px] -z-10 animate-pulse-slow"></div>

          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-8">
              
              {/* Left Side: Copy */}
              <div className="flex-1 text-center md:text-left space-y-6 max-w-2xl">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter leading-[1.15]">
                  Start extracting your <br className="hidden lg:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">highest-fidelity</span> media today.
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Join thousands of creators, researchers, and archivers utilizing ALPARSLAN's uncompromising engines to secure their digital libraries.
                </p>
                
                <div className="flex items-center justify-center md:justify-start gap-6 pt-4">
                  <div className="flex -space-x-3">
                    <img className="w-10 h-10 rounded-full border-2 border-background object-cover" src="https://mockmind-api.uifaces.co/content/human/222.jpg" alt="User 1" />
                    <img className="w-10 h-10 rounded-full border-2 border-background object-cover" src="https://mockmind-api.uifaces.co/content/human/181.jpg" alt="User 2" />
                    <img className="w-10 h-10 rounded-full border-2 border-background object-cover" src="https://mockmind-api.uifaces.co/content/human/168.jpg" alt="User 3" />
                  </div>
                  <div className="text-sm font-medium">
                    <span className="text-foreground">5,000+</span><br/>
                    <span className="text-muted-foreground">Power Users</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Action */}
              <div className="shrink-0 relative group mt-4 md:mt-0">
                <div className="absolute -inset-2 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/40 transition-colors duration-500"></div>
                
                <Link to="/dashboard" className="block relative group">
                  <button className="relative w-full sm:w-auto flex items-center justify-center gap-2.5 text-base px-8 py-3.5 rounded-full border border-primary/50 bg-primary text-white font-bold tracking-wide shadow-lg shadow-primary/30 hover:scale-105 hover:shadow-primary/50 transition-all duration-300">
                    <span>Get Started</span>
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </div>
                  </button>
                </Link>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground font-medium w-full text-center">
                   <Shield className="w-4 h-4 text-success" /> Fully encrypted transfers.
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Premium Footer */}
      <footer className="relative bg-background border-t border-border/40 overflow-hidden z-10">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
        
        <div className="container mx-auto px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <img 
                  src={theme === 'dark' ? '/logo_dark.png' : '/logo_light.png'} 
                  alt="ALPARSLAN Logo" 
                  className="h-6 md:h-7 w-auto" 
                />
                <span className="font-black text-xl md:text-2xl tracking-tight text-foreground translate-y-[1px]">ALPARSLAN</span>
              </div>
              <p className="text-muted-foreground max-w-sm leading-relaxed">
                The ultimate media extraction tool designed for uncompromising performance. Built with precision for users who demand the best.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold tracking-wide">Product</h4>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors inline-block w-fit">Features</a>
                <Link to="/docs" className="hover:text-primary transition-colors inline-block w-fit">Documentation</Link>
                <a href="#" className="hover:text-primary transition-colors inline-block w-fit">Pricing</a>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold tracking-wide">Legal</h4>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors inline-block w-fit">Privacy Policy</a>
                <a href="#" className="hover:text-primary transition-colors inline-block w-fit">Terms of Service</a>
                <a href="#" className="hover:text-primary transition-colors inline-block w-fit">GitHub License</a>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-muted-foreground/80">
              © {new Date().getFullYear()} ALPARSLAN. Built for speed.
            </p>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer">
                <span className="sr-only">X (Twitter)</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer">
                <span className="sr-only">Facebook</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer">
                <span className="sr-only">GitHub</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
