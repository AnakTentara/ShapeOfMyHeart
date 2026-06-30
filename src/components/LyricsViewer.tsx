import { useRef, useEffect } from 'react';
import type { LyricLine } from '../types';
import gsap from 'gsap';

interface LyricsViewerProps {
  lyrics: LyricLine[];
  activeLyricIndex: number;
  onLineClick: (index: number) => void;
}

export const LyricsViewer: React.FC<LyricsViewerProps> = ({
  lyrics,
  activeLyricIndex,
  onLineClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Function to center the active lyric line
  const centerActiveLine = (animate = true) => {
    if (!containerRef.current || !viewportRef.current) return;
    
    const viewportHeight = viewportRef.current.clientHeight;
    const centerY = viewportHeight / 2;
    
    // Default centering offset if no line is active yet
    let targetY = centerY - 50;

    if (activeLyricIndex >= 0 && lineRefs.current[activeLyricIndex]) {
      const activeLine = lineRefs.current[activeLyricIndex]!;
      const activeLineOffsetTop = activeLine.offsetTop;
      const activeLineHeight = activeLine.clientHeight;
      
      // Calculate target translation so the center of the active line is in the center of the viewport
      targetY = centerY - activeLineOffsetTop - activeLineHeight / 2;
    }

    // Animate the container's Y translation using GSAP
    gsap.killTweensOf(containerRef.current);
    if (animate) {
      gsap.to(containerRef.current, {
        y: targetY,
        duration: 0.8,
        ease: 'power3.out',
        overwrite: 'auto'
      });
    } else {
      gsap.set(containerRef.current, { y: targetY });
    }
  };

  // Run centering calculation when active line index changes
  useEffect(() => {
    centerActiveLine(true);
  }, [activeLyricIndex]);

  // Recalculate on window resize to ensure it stays centered
  useEffect(() => {
    const handleResize = () => centerActiveLine(false);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeLyricIndex]);

  return (
    <div className="lyrics-viewport" ref={viewportRef}>
      <div className="lyrics-container" ref={containerRef}>
        {lyrics.map((line, index) => {
          let statusClass = 'future';
          if (index === activeLyricIndex) {
            statusClass = 'active';
          } else if (index < activeLyricIndex) {
            statusClass = 'past';
          }

          return (
            <div
              key={index}
              ref={(el) => {
                lineRefs.current[index] = el;
              }}
              className={`lyric-line ${statusClass}`}
              onClick={() => onLineClick(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onLineClick(index);
                }
              }}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};
