import { useEffect, useRef, useState } from 'react';

interface ScrollingTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

/**
 * ScrollingTitle
 * - Detects when the inner text overflows the container.
 * - On hover, when overflowing, shows a left-to-right continuous scrolling animation.
 * - Short text remains static.
 */
export default function ScrollingTitle({ children, title, className = '', ...rest }: ScrollingTitleProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    const content = contentRef.current;
    if (!el || !content) return;

    const check = () => {
      // use scrollWidth vs clientWidth to detect overflow
      setOverflowing(content.scrollWidth > el.clientWidth + 1);
    };

    check();
    // re-check on window resize
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [children]);

  // Estimate animation duration based on text width ratio so speed looks natural
  const getDuration = () => {
    const el = containerRef.current;
    const content = contentRef.current;
    if (!el || !content) return 8;
    const ratio = content.scrollWidth / el.clientWidth;
    // clamp duration between 5s and 20s
    return Math.min(Math.max(5 * ratio, 5), 20);
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden w-full ${className}`}
      title={title}
      {...rest}
    >
      {overflowing ? (
        // Duplicate content to produce a seamless loop effect.
        // The marquee runs only while hovered (controlled via :hover on .marquee-wrapper).
        <>
          <style>{`
            .marquee-wrapper { display:block; width:100%; }
            .marquee-inner { display:inline-flex; gap:1.25rem; will-change:transform; }
            .marquee-item { white-space:nowrap; display:inline-block; }
            /* start no animation; animate on hover of parent */
            .marquee-wrapper:hover .marquee-inner {
              animation-name: marquee-ltr;
              animation-timing-function: linear;
              animation-iteration-count: infinite;
              animation-duration: var(--marquee-duration, 8s);
            }
            @keyframes marquee-ltr {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(0%); }
            }
          `}</style>

          <div
            className="marquee-wrapper"
            // set CSS custom prop for duration dynamically
            style={{ ['--marquee-duration' as any]: `${getDuration()}s` }}
          >
            <div
              className="marquee-inner"
              ref={contentRef}
              // we render two identical items so that animation appears continuous
            >
              <span className="marquee-item">{children}</span>
              <span className="marquee-item" aria-hidden="true">{children}</span>
            </div>
          </div>
        </>
      ) : (
        <div ref={contentRef} className="truncate">
          {children}
        </div>
      )}
    </div>
  );
}
