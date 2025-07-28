import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { log } from '@/lib/logger';

interface ExpandableTextProps {
  children: ReactNode;
  maxLines?: number;
  lineHeight?: number;
  expandButtonText?: string;
  collapseButtonText?: string;
}

export const ExpandableText: React.FC<ExpandableTextProps> = ({
  children,
  maxLines = 9,
  lineHeight = 24,
  expandButtonText = '展開',
  collapseButtonText = '收合',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLong, setIsLong] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const maxHeight = lineHeight * maxLines;

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        const isContentLong = entry.target.scrollHeight > maxHeight;
        if (isLong !== isContentLong) {
          setIsLong(isContentLong);
        }
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [maxHeight, isLong, children]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const textStyle: React.CSSProperties = {
    lineHeight: `${lineHeight}px`,
    maxHeight: isExpanded ? 'none' : `${maxHeight}px`,
    overflow: 'hidden',
    transition: 'max-height 0.3s ease-in-out',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  return (
    <div>
      <div
        ref={contentRef}
        style={textStyle}
        className="text-sm font-normal text-prayfor-text leading-6"
      >
        {children}
      </div>
      {isLong && (
        <button
          onClick={toggleExpand}
          className="text-sm font-semibold text-prayfor-text_light mt-1"
          style={{ background: 'none', border: 'none', padding: '0', cursor: 'pointer' }}
        >
          {isExpanded ? collapseButtonText : expandButtonText}
        </button>
      )}
    </div>
  );
}; 