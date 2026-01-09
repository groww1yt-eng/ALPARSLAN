'use client';

import React, { useRef, useEffect, useState } from 'react';

interface ScrollingTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

/**
 * ScrollingTitle Component
 * Wraps text content and detects if it overflows its container.
 * Intended to be used (conceptually) for marquees or scrolling text, though currently just sets logic for overflow checks.
 */
export const ScrollingTitle: React.FC<ScrollingTitleProps> = ({
  children,
  className = '',
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Check valid overflow on mount and resize
  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current) {
        const isOverflow =
          containerRef.current.scrollWidth > containerRef.current.clientWidth;
        setIsOverflowing(isOverflow);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);

    return () => window.removeEventListener('resize', checkOverflow);
  }, [children]);

  return (
    <div
      ref={containerRef}
      {...props}
      className={`overflow-x-auto scrollbar-hide ${className}`}
      style={{
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div className="flex whitespace-nowrap">
        {children}
      </div>
    </div>
  );
};

export default ScrollingTitle;
