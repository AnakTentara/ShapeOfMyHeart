import React, { useRef, useEffect } from 'react';
import { Play } from '@phosphor-icons/react';
import gsap from 'gsap';

interface PlayButtonProps {
  isVisible: boolean;
  onClick: () => void;
  onAnimationComplete: () => void;
}

export const PlayButton: React.FC<PlayButtonProps> = ({
  isVisible,
  onClick,
  onAnimationComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (isVisible) {
      // Entry Animation: scale up and fade in
      gsap.killTweensOf([containerRef.current, buttonRef.current, hintRef.current]);
      
      gsap.set(containerRef.current, { visibility: 'visible' });
      
      gsap.fromTo(containerRef.current, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
      
      gsap.fromTo(buttonRef.current, 
        { scale: 0.3, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.6)' }
      );

      gsap.fromTo(hintRef.current, 
        { y: 20, opacity: 0 }, 
        { y: 0, opacity: 0.7, duration: 0.6, delay: 0.3, ease: 'power3.out' }
      );
    } else {
      // Exit Animation: shrink and fade out
      gsap.killTweensOf([containerRef.current, buttonRef.current, hintRef.current]);
      
      gsap.to(buttonRef.current, {
        scale: 0.7,
        opacity: 0,
        duration: 0.45,
        ease: 'power3.in',
      });

      gsap.to(hintRef.current, {
        y: -10,
        opacity: 0,
        duration: 0.3,
        ease: 'power3.in'
      });

      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.inOut',
        onComplete: () => {
          gsap.set(containerRef.current, { visibility: 'hidden' });
          onAnimationComplete();
        }
      });
    }
  }, [isVisible, onAnimationComplete]);

  // Subtle floating idle animation using GSAP
  useEffect(() => {
    if (isVisible && buttonRef.current) {
      const floatTween = gsap.to(buttonRef.current, {
        y: -6,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
      return () => {
        floatTween.kill();
      };
    }
  }, [isVisible]);

  return (
    <div className="play-screen" ref={containerRef}>
      <div 
        className="play-button-container" 
        ref={buttonRef} 
        onClick={onClick}
        role="button"
        aria-label="Play Shape Of My Heart"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick();
          }
        }}
      >
        <Play className="play-icon-svg" weight="fill" />
      </div>
      <p className="play-hint" ref={hintRef}>Tap to feel the shape</p>
    </div>
  );
};
