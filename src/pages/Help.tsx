import { HelpCircle, Mail, BookOpen, MessageSquare, ExternalLink, AlertTriangle, Lightbulb, ShieldAlert, Settings2, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Help() {
  const faqs = [
    {
      question: "Where are my downloaded files saved?",
      answer: "You can find your downloaded files in the Default Output Folder specified in the Settings page. By default, it usually points to your system's Downloads directory."
    },
    {
      question: "Why did a download fail?",
      answer: "Downloads can fail due to network interruptions, age-restricted content requiring authentication, or unsupported platforms. Check the History tab for specific error messages."
    },
    {
      question: "Does this proxy my IP address?",
      answer: "By default all extractions occur directly from your host IP. If you desire privacy, please ensure your system VPN is active before initiating a batch download."
    },
    {
      question: "Can I download age-restricted videos?",
      answer: "Currently, age-restricted videos that require sign-in accounts are blocked by YouTube unless you supply a valid cookies.txt file into the backend root directory."
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center gap-4 pb-6 border-b border-border/50">
          <div className="p-4 bg-primary/10 rounded-2xl shrink-0">
            <HelpCircle className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Help & Support</h1>
            <p className="text-muted-foreground text-lg">
              Find answers to common questions or access our extended support channels.
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/docs" className="flex items-center gap-4 p-5 rounded-2xl border border-border/50 bg-secondary/10 hover:bg-secondary/30 transition-colors group">
            <div className="p-3 bg-secondary rounded-xl group-hover:bg-background transition-colors">
              <BookOpen className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">Read the Documentation <ExternalLink className="w-3 h-3" /></h3>
              <p className="text-sm text-muted-foreground">Comprehensive guides and CLI tutorials.</p>
            </div>
          </Link>

          <a href="#" className="flex items-center gap-4 p-5 rounded-2xl border border-border/50 bg-secondary/10 hover:bg-secondary/30 transition-colors group">
            <div className="p-3 bg-secondary rounded-xl group-hover:bg-background transition-colors">
              <Mail className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">Contact Developer <ExternalLink className="w-3 h-3" /></h3>
              <p className="text-sm text-muted-foreground">Reach out directly via email for bug reports.</p>
            </div>
          </a>
        </div>

        {/* FAQ Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" /> Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="p-5 rounded-2xl border border-border/50 bg-secondary/5">
                <h3 className="font-semibold text-foreground mb-2 text-base">{faq.question}</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Troubleshooting Section */}
        <div className="space-y-6 pt-8">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Troubleshooting Guide
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {[
              {
                title: "403 Forbidden Error",
                desc: "Usually happens when YouTube detect unusual traffic. Try enabling a VPN or changing your IP address. If it persists, you may need to update the backend extraction engine.",
                icon: ShieldAlert
              },
              {
                title: "429 Too Many Requests",
                desc: "You have initiated too many metadata requests in a short window. Wait 5-10 minutes before trying again. Avoid rapid-fire URL submissions.",
                icon: Settings2
              },
              {
                title: "FFmpeg Not Found",
                desc: "Ensure FFmpeg is correctly installed and added to your system environment PATH. ALPARSLAN requires it for merging high-quality video and audio streams.",
                icon: Terminal
              }
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-5 rounded-2xl border border-border/50 bg-secondary/10">
                <div className="p-3 bg-secondary rounded-xl shrink-0 h-fit">
                  <item.icon className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="p-6 rounded-3xl border border-primary/20 bg-primary/5 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
            <Lightbulb className="w-5 h-5" /> Professional Tips
          </h2>
          <ul className="space-y-3">
            {[
              "Use 'Best' quality for archival, but '1080p' if you need smaller portable file sizes.",
              "For music, use 'MP3 320kbps' for the highest fidelity playback on mobile devices.",
              "Batch download playlists overnight to avoid hitting API rate limits during active work.",
              "Regularly check the 'Compatibility' tab to ensure your local engine is up to speed."
            ].map((tip, i) => (
              <li key={i} className="flex gap-3 text-sm text-foreground/90">
                <span className="text-primary font-bold">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
