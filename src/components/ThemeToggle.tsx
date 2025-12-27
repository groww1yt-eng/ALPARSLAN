import { Sun, Moon } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useEffect } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useAppStore();
  const isDark = theme === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('light');
    } else {
      root.classList.add('light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative flex items-center w-14 h-7 rounded-full bg-secondary border border-border transition-all duration-300 hover:border-primary/50"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Track icons */}
      <Sun className="absolute left-1.5 w-4 h-4 text-warning transition-opacity duration-300" 
           style={{ opacity: isDark ? 0.3 : 1 }} />
      <Moon className="absolute right-1.5 w-4 h-4 text-primary transition-opacity duration-300"
            style={{ opacity: isDark ? 1 : 0.3 }} />
      
      {/* Sliding knob */}
      <span 
        className={`
          absolute w-5 h-5 rounded-full bg-card border border-border shadow-md
          transition-all duration-300 ease-out
          ${isDark ? 'left-[calc(100%-1.5rem)]' : 'left-0.5'}
        `}
      />
    </button>
  );
}
