import { useState, useRef, useEffect } from 'react';
import { PlayButton } from './components/PlayButton';
import { LyricsViewer } from './components/LyricsViewer';
import { lyricsData } from './lyricsData';
import { Play, Pause, ArrowCounterClockwise, X } from '@phosphor-icons/react';
import gsap from 'gsap';

function App() {
  const [isPreloading, setIsPreloading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const [showPlayScreen, setShowPlayScreen] = useState(true);
  const [showApp, setShowApp] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(6.0);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const appRef = useRef<HTMLDivElement>(null);
  const isFadingOutRef = useRef(false);

  const START_TIME = 6.0;
  const END_TIME = 29.0; // 1:10
  const TOTAL_PLAY_DURATION = END_TIME - START_TIME;

  // Initialize Audio & Preload with Progress Tracking
  useEffect(() => {
    const audio = new Audio();
    audio.loop = false;
    audioRef.current = audio;

    const loadAudioFile = async () => {
      try {
        const response = await fetch('/shape_of_my_heart.ogg');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const reader = response.body?.getReader();
        const contentLength = +(response.headers.get('Content-Length') || 0);

        if (!reader || contentLength === 0) {
          // Fallback if reader is not available
          const blob = await response.blob();
          const audioUrl = URL.createObjectURL(blob);
          audio.src = audioUrl;
          setLoadingProgress(100);
          gsap.to('.preloader-screen', {
            opacity: 0,
            duration: 0.6,
            onComplete: () => setIsPreloading(false)
          });
          return;
        }

        let receivedLength = 0;
        const chunks = [];
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          receivedLength += value.length;
          const percent = Math.round((receivedLength / contentLength) * 100);
          setLoadingProgress(percent);
        }

        const blob = new Blob(chunks, { type: 'audio/ogg' });
        const audioUrl = URL.createObjectURL(blob);
        audio.src = audioUrl;
        
        // Wait briefly for a smooth transition from 100%
        setTimeout(() => {
          gsap.to('.preloader-screen', {
            opacity: 0,
            duration: 0.6,
            onComplete: () => setIsPreloading(false)
          });
        }, 300);

      } catch (err) {
        console.warn("Failed to preload audio with progress tracking, falling back to direct stream:", err);
        // Fallback: load directly from URL
        audio.src = '/shape_of_my_heart.ogg';
        audio.load();
        
        // When metadata is loaded, we can continue
        const onMetadata = () => {
          setLoadingProgress(100);
          gsap.to('.preloader-screen', {
            opacity: 0,
            duration: 0.6,
            onComplete: () => setIsPreloading(false)
          });
        };
        audio.addEventListener('loadedmetadata', onMetadata);
      }
    };

    loadAudioFile();

    const handleTimeUpdate = () => {
      if (!audioRef.current || isFadingOutRef.current) return;

      const time = audioRef.current.currentTime;
      setCurrentTime(time);

      // Check if we reached the end boundary
      if (time >= END_TIME) {
        triggerFadeOutAndReset();
      }
    };

    const handleAudioEnded = () => {
      if (isFadingOutRef.current) return;
      triggerFadeOutAndReset();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleAudioEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleAudioEnded);
      audio.pause();
    };
  }, []);

  // Update active lyric index based on current time
  useEffect(() => {
    if (isFadingOutRef.current) return;

    // Find the current active line
    const index = lyricsData.findIndex(
      (line) => currentTime >= line.start && currentTime < line.end
    );

    if (index !== -1) {
      setActiveLyricIndex(index);
    } else {
      // Fallback: If current time is past the last line, keep last line highlighted
      if (currentTime >= lyricsData[lyricsData.length - 1].end) {
        setActiveLyricIndex(lyricsData.length - 1);
      } else if (currentTime < lyricsData[0].start) {
        setActiveLyricIndex(-1);
      }
    }
  }, [currentTime]);

  // Handle Play Screen click: Starts playback and fades in main app
  const handlePlayStart = () => {
    setShowPlayScreen(false);
  };

  const handlePlayScreenExitComplete = () => {
    if (!audioRef.current) return;

    // Set starting time
    audioRef.current.currentTime = START_TIME;
    audioRef.current.volume = 1.0;
    
    // Play audio
    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
        setShowApp(true);

        // Animate App Interface Entrance
        gsap.killTweensOf(appRef.current);
        gsap.fromTo(appRef.current,
          { autoAlpha: 0, scale: 0.96 },
          { autoAlpha: 1, scale: 1, duration: 0.8, ease: 'power4.out' }
        );

        // Slide down music header
        gsap.fromTo('.music-header',
          { y: -30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, delay: 0.2, ease: 'power3.out' }
        );

        // Slide up controls
        gsap.fromTo('.player-controls-container',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, delay: 0.2, ease: 'power3.out' }
        );
      })
      .catch((err) => {
        console.error("Audio playback error:", err);
        // Fallback if audio blocks
        setShowPlayScreen(true);
      });
  };

  // Fade out music and reset application back to Play Screen
  const triggerFadeOutAndReset = () => {
    if (isFadingOutRef.current || !audioRef.current) return;
    isFadingOutRef.current = true;

    // 1. Fade out audio volume using GSAP
    gsap.killTweensOf(audioRef.current);
    gsap.to(audioRef.current, {
      volume: 0,
      duration: 1.5,
      ease: 'power1.in',
      onComplete: () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = START_TIME;
          audioRef.current.volume = 1.0;
        }
        setIsPlaying(false);
        isFadingOutRef.current = false;
        setShowPlayScreen(true);
      }
    });

    // 2. Fade out App Interface
    gsap.killTweensOf(appRef.current);
    gsap.to(appRef.current, {
      autoAlpha: 0,
      scale: 0.96,
      duration: 0.8,
      ease: 'power3.inOut',
      onComplete: () => {
        setShowApp(false);
        setActiveLyricIndex(-1);
        setCurrentTime(START_TIME);
      }
    });
  };

  // Seek audio helper
  const seekToTime = (time: number) => {
    if (!audioRef.current || isFadingOutRef.current) return;
    // Constrain seek time within bounds
    const boundedTime = Math.max(START_TIME, Math.min(time, END_TIME));
    audioRef.current.currentTime = boundedTime;
    setCurrentTime(boundedTime);
  };

  // Seek bar click handler
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isFadingOutRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const targetTime = START_TIME + (percentage * TOTAL_PLAY_DURATION);
    seekToTime(targetTime);
  };

  // Lyric line click handler (Seeking directly to line start)
  const handleLyricLineClick = (index: number) => {
    if (isFadingOutRef.current) return;
    const targetLine = lyricsData[index];
    // Seek to the line start time
    seekToTime(targetLine.start);
  };

  // Toggle play/pause inside the lyrics player
  const togglePlayPause = () => {
    if (!audioRef.current || isFadingOutRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // If we paused right at the end, reset to start
      if (audioRef.current.currentTime >= END_TIME) {
        audioRef.current.currentTime = START_TIME;
      }
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(console.error);
    }
  };

  // Restart playback to 47.0s
  const handleRestart = () => {
    seekToTime(START_TIME);
    if (audioRef.current && !isPlaying) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(console.error);
    }
  };

  // Calculate Progress Percent for seekbar
  const progressPercent = Math.min(
    100,
    Math.max(0, ((currentTime - START_TIME) / TOTAL_PLAY_DURATION) * 100)
  );

  // Format time display (e.g. 0:47)
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app-container">
      {/* 0. Preloader Screen overlay */}
      {isPreloading && (
        <div className="preloader-screen">
          <div className="loader-container">
            <div className="loader-ring"></div>
            <div className="loader-ring-inner"></div>
            <span className="loader-text">{loadingProgress}%</span>
          </div>
          <p className="loader-hint">Preloading Audio</p>
        </div>
      )}

      {/* Background Visual Layer */}
      <div className="bg-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="vignette"></div>
        
        {/* Glowing visualizer ring behind play button */}
        <div className={`visualizer-overlay ${isPlaying && !isFadingOutRef.current ? 'active' : ''}`}>
          <div className="pulse-ring"></div>
          <div className="pulse-ring"></div>
          <div className="pulse-ring"></div>
        </div>
      </div>

      {/* 1. Center Play Screen */}
      {showPlayScreen && !isPreloading && (
        <PlayButton
          isVisible={showPlayScreen}
          onClick={handlePlayStart}
          onAnimationComplete={handlePlayScreenExitComplete}
        />
      )}

      {/* 2. Lyrics App Interface Screen */}
      {showApp && (
        <div className="app-interface" ref={appRef}>
          <header className="music-header">
            <span className="artist-name">Backstreet Boys</span>
            <h1 className="song-title">Shape of My Heart</h1>
          </header>

          <LyricsViewer
            lyrics={lyricsData}
            activeLyricIndex={activeLyricIndex}
            onLineClick={handleLyricLineClick}
          />

          <div className="player-controls-container">
            {/* Seekbar Progress track */}
            <div className="progress-track-wrapper" onClick={handleProgressBarClick}>
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            
            {/* Time labels */}
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(END_TIME)}</span>
            </div>

            {/* Controls buttons panel */}
            <div className="controls-buttons">
              <button 
                className="btn-control" 
                onClick={handleRestart} 
                title="Restart"
                aria-label="Restart song from reff"
              >
                <ArrowCounterClockwise size={20} weight="bold" />
              </button>

              <button 
                className="btn-control" 
                onClick={togglePlayPause} 
                title={isPlaying ? "Pause" : "Play"}
                aria-label={isPlaying ? "Pause playback" : "Resume playback"}
                style={{ transform: 'scale(1.15)', borderColor: isPlaying ? 'var(--accent-cyan)' : 'var(--glass-border)' }}
              >
                {isPlaying ? (
                  <Pause size={22} weight="fill" />
                ) : (
                  <Play size={22} weight="fill" style={{ transform: 'translateX(1px)' }} />
                )}
              </button>

              <button 
                className="btn-control" 
                onClick={triggerFadeOutAndReset} 
                title="Return to Main"
                aria-label="Close and return to play screen"
              >
                <X size={20} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
