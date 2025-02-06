import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Heart, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Volume2 } from 'lucide-react';
import { usePlayer } from '../../hooks/usePlayer';
import { Howl } from 'howler';
import { useFavorites } from '../../hooks/useFavorites';

export const PlayerBar = () => {
  const [isClient, setIsClient] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const soundRef = useRef<Howl | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    currentTrack, 
    isPlaying,
    volume,
    progress,
    duration,
    setIsPlaying,
    setProgress,
    setDuration,
    setVolume,
    playNext,
    playPrevious 
  } = usePlayer();

  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  // Clean up function helper
  const clearProgressInterval = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  // Initialize component and audio context
  useEffect(() => {
    setIsClient(true);

    // Pre-initialize Howler with suspended state
    if (typeof window !== 'undefined' && !audioInitialized) {
      window.Howler.autoSuspend = false;
      window.Howler.html5PoolSize = 20;
      window.Howler.autoUnlock = false;
      setAudioInitialized(true);
    }

    // Setup audio unlock handlers
    const unlockAudio = () => {
      if (window.Howler.ctx?.state === 'suspended') {
        window.Howler.ctx.resume().then(() => {
          console.log('[PlayerBar] AudioContext resumed');
          if (soundRef.current) {
            soundRef.current.load();
          }
        });
      }
    };

    ['click', 'touchstart', 'keydown'].forEach(event => 
      document.addEventListener(event, unlockAudio, { once: true })
    );

    return () => {
      // ...existing cleanup...
      if (soundRef.current) {
        console.log('[PlayerBar] Cleaning up sound');
        soundRef.current.unload();
      }
      clearProgressInterval();
      ['click', 'touchstart', 'keydown'].forEach(event => 
        document.removeEventListener(event, unlockAudio)
      );
    };
  }, []);

  // Handle track changes
  useEffect(() => {
    if (!currentTrack || !isClient || !audioInitialized) {
      console.log('[PlayerBar] Waiting for initialization...', { 
        hasTrack: !!currentTrack, 
        isClient, 
        audioInitialized 
      });
      return;
    }

    try {
      console.log('[PlayerBar] Loading track:', currentTrack.title);

      const sound = new Howl({
        src: [currentTrack.streamUrl],
        html5: true,
        preload: true,
        format: ['mp3'],
        pool: 1,
        onload: () => {
          console.log('[PlayerBar] Track loaded:', currentTrack.title);
          setDuration(sound.duration());
        },
        onplay: () => {
          console.log('[PlayerBar] Track playing:', currentTrack.title);
          setIsPlaying(true);
        },
        onpause: () => {
          console.log('[PlayerBar] Track paused:', currentTrack.title);
          setIsPlaying(false);
        },
        onend: () => {
          console.log('[PlayerBar] Track ended:', currentTrack.title);
          playNext();
        },
        onloaderror: (id, error) => {
          console.error('[PlayerBar] Load error:', error);
        },
        onplayerror: (id, error) => {
          console.error('[PlayerBar] Play error:', error);
        }
      });

      soundRef.current = sound;

      return () => {
        sound.unload();
      };
    } catch (error) {
      console.error('[PlayerBar] Error creating Howl instance:', error);
    }
  }, [currentTrack, isClient, audioInitialized]);

  // Handle play/pause
  useEffect(() => {
    if (!soundRef.current) return;

    console.log('[PlayerBar] Play state changed:', isPlaying);
    if (isPlaying) {
      soundRef.current.play();
    } else {
      soundRef.current.pause();
    }
  }, [isPlaying]);

  // Handle progress updates
  useEffect(() => {
    if (!soundRef.current || !isPlaying) {
      clearProgressInterval();
      return;
    }

    progressInterval.current = setInterval(() => {
      if (soundRef.current) {
        const currentTime = soundRef.current.seek() as number;
        setProgress(currentTime);
      }
    }, 1000);

    return clearProgressInterval;
  }, [isPlaying, duration]);

  // Handle progress updates with client-side only rendering
  useEffect(() => {
    if (isClient && duration > 0) {
      const width = `${(progress / duration) * 100}%`;
    }
  }, [isClient, progress, duration]);

  // Update progress width when progress changes
  useEffect(() => {
    if (duration > 0) {
      const width = `${(progress / duration) * 100}%`;
      console.log('[PlayerBar] Updating progress width:', width);
    }
  }, [progress, duration]);

  const handleTogglePlayPause = () => {
    if (isPlaying) {
      soundRef.current?.pause();
      setIsPlaying(false);
    } else {
      soundRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleFavoriteClick = () => {
    if (!currentTrack) return;
    
    if (isFavorite(currentTrack.identifier)) {
      removeFavorite(currentTrack.identifier);
    } else {
      addFavorite(currentTrack);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedValue = (x / rect.width) * duration;
    
    soundRef.current?.seek(clickedValue);
    setProgress(clickedValue);
  };

  const handleVolumeChange = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    
    const volumeBar = e.currentTarget;
    const rect = volumeBar.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newVolume = x / rect.width;
    
    soundRef.current?.volume(newVolume);
    setVolume(newVolume);
  }, [setVolume]);

  const handleVolumeMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons === 1) { // Verifica se o botão esquerdo está pressionado
      handleVolumeChange(e);
    }
  };

  const handlePlayClick = () => {
    if (!currentTrack) return;

    if (isPlaying) {
      soundRef.current?.pause();
      setIsPlaying(false);
    } else {
      soundRef.current?.play();
      setIsPlaying(true);
    }
  };

  // Calculate progress width without state
  const getProgressWidth = () => {
    if (!isClient || !duration) return '0%';
    return `${(progress / duration) * 100}%`;
  };

  // Handle initial client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-800/95 backdrop-blur-md border-t border-zinc-700 p-4">
      <div className="flex flex-col md:flex-row items-center justify-between max-w-screen-2xl mx-auto gap-4 md:gap-0">
        {/* Track Info */}
        <div className="flex items-center gap-4 w-full md:w-1/3">
          {currentTrack ? (
            <>
              <img 
                src={`https://archive.org/services/img/${currentTrack.identifier.split('/')[0]}`}
                className="w-12 h-12 rounded bg-zinc-700 hidden sm:block"
                alt=""
                onError={(e) => {
                  e.currentTarget.src = '/album-placeholder.png';
                }}
              />
              <div className="max-w-[200px] sm:max-w-none">
                <h4 className="font-medium truncate">{currentTrack.title}</h4>
                <p className="text-sm text-zinc-400 truncate">{currentTrack.creator}</p>
              </div>
              <button onClick={handleFavoriteClick} className="ml-2">
                <Heart
                  size={20}
                  className={`${
                    isFavorite(currentTrack.identifier)
                      ? 'fill-emerald-500 text-emerald-500'
                      : 'text-zinc-400 hover:text-emerald-500'
                  }`}
                />
              </button>
            </>
          ) : (
            <div className="text-zinc-500">Escolha uma música para começar</div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-2 w-full md:w-1/3">
          <div className="flex items-center gap-4">
            <button className="text-zinc-400 hover:text-emerald-500">
              <Shuffle size={18} />
            </button>
            <button 
              onClick={playPrevious} // Now playPrevious is available
              className="text-zinc-400 hover:text-emerald-500"
              disabled={!currentTrack}
            >
              <SkipBack size={24} />
            </button>
            <button 
              onClick={handlePlayClick}
              className={`
                w-10 h-10 rounded-full
                ${isPlaying 
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-zinc-700'
                }
                flex items-center justify-center
                transition-all duration-200
                ${!currentTrack && 'opacity-50 cursor-not-allowed'}
              `}
              disabled={!currentTrack}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            <button 
              onClick={playNext}
              className="text-zinc-400 hover:text-emerald-500"
              disabled={!currentTrack}
            >
              <SkipForward size={24} />
            </button>
            <button className="text-zinc-400 hover:text-emerald-500">
              <Repeat size={18} />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-zinc-400 w-10">
              {formatTime(progress)}
            </span>
            <div 
              className="flex-1 h-1 bg-zinc-600 rounded-full cursor-pointer group"
              onClick={handleProgressClick}
            >
              {isClient && (
                <div 
                  className="h-full bg-emerald-500 rounded-full relative group-hover:bg-emerald-400 transition-all duration-200"
                  style={{ width: getProgressWidth() }}
                >
                  <div className="hidden group-hover:block absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
                </div>
              )}
            </div>
            <span className="text-xs text-zinc-400 w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume */}
        <div className="hidden md:flex items-center gap-2 w-1/3 justify-end">
          <Volume2 size={20} className="text-zinc-400" />
          <div 
            className="w-24 h-1 bg-zinc-600 rounded-full cursor-pointer group"
            onClick={handleVolumeChange}
            onMouseMove={handleVolumeMouseMove}
            onDragStart={(e) => e.preventDefault()}
          >
            {isClient && (
              <div 
                className="h-full bg-emerald-500 rounded-full group-hover:bg-emerald-400 transition-all"
                style={{ width: `${volume * 100}%` }}
              >
                <div className="hidden group-hover:block absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Simple toast component
const toast = ({ title, description, status, duration, isClosable }: any) => {
  const toastEl = document.createElement('div');
  toastEl.className = `
    fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg
    ${status === 'info' ? 'bg-blue-500' : 'bg-zinc-800'}
    text-white
  `;
  toastEl.innerHTML = `
    <h3 class="font-bold">${title}</h3>
    <p class="text-sm opacity-90">${description}</p>
  `;
  
  document.body.appendChild(toastEl);
  
  if (duration) {
    setTimeout(() => {
      toastEl.remove();
    }, duration);
  }
  
  if (isClosable) {
    toastEl.addEventListener('click', () => toastEl.remove());
  }
};
