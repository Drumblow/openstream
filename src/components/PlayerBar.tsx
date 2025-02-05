import React, { useRef, useEffect } from 'react';
import { Heart, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Volume2 } from 'lucide-react';
import { usePlayer } from '../hooks/usePlayer';
import { Howl } from 'howler';
import { useFavorites } from '../hooks/useFavorites';

export const PlayerBar = () => {
  const { 
    currentTrack, 
    playlist,
    isPlaying, 
    progress,
    duration,
    setProgress,
    setDuration,
    setIsPlaying,
    playNext,
    playPrevious,
    togglePlayPause 
  } = usePlayer();

  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const soundRef = useRef<Howl | null>(null);

  useEffect(() => {
    if (currentTrack) {
      if (soundRef.current) {
        soundRef.current.unload();
      }

      const sound = new Howl({
        src: [currentTrack.streamUrl],
        html5: true,
        onload: () => {
          setDuration(sound.duration());
          sound.play();
        },
        onplay: () => setIsPlaying(true),
        onpause: () => setIsPlaying(false),
        onstop: () => setIsPlaying(false),
        onseek: () => {
          setProgress(sound.seek() as number);
        },
        onend: () => {
          setIsPlaying(false);
          setProgress(0);
        }
      });

      soundRef.current = sound;
    }

    return () => {
      if (soundRef.current) {
        soundRef.current.unload();
      }
    };
  }, [currentTrack]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (soundRef.current && isPlaying) {
        setProgress(soundRef.current.seek() as number);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const sound = soundRef.current;
    if (sound) {
      sound.on('end', () => {
        playNext(); // Automatically play next track when current ends
      });
    }
    return () => {
      if (sound) {
        sound.off('end');
      }
    };
  }, [playNext]);

  const handleTogglePlayPause = () => {
    if (soundRef.current) {
      if (isPlaying) {
        soundRef.current.pause();
      } else {
        soundRef.current.play();
      }
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

  return (
    <div className="bg-zinc-800/95 backdrop-blur-md border-t border-zinc-700 p-4">
      <div className="flex flex-col md:flex-row items-center justify-between max-w-screen-2xl mx-auto gap-4 md:gap-0">
        {/* Track Info */}
        <div className="flex items-center gap-4 w-full md:w-1/3 justify-center md:justify-start">
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
            <div className="text-zinc-500">Nenhuma música selecionada</div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-2 w-full md:w-1/3 order-first md:order-none">
          <div className="flex items-center gap-4">
            <Shuffle size={20} className="hidden sm:block text-zinc-400 hover:text-emerald-500 cursor-pointer" />
            <button onClick={playPrevious}>
              <SkipBack size={20} />
            </button>
            <button 
              onClick={handleTogglePlayPause}
              className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-emerald-500"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button onClick={playNext}>
              <SkipForward size={20} />
            </button>
            <Repeat size={20} className="hidden sm:block text-zinc-400 hover:text-emerald-500 cursor-pointer" />
          </div>
          
          {/* Progress bar */}
          <div className="flex items-center gap-2 w-full px-4">
            <span className="text-xs text-zinc-400 hidden sm:block">{formatTime(progress)}</span>
            <div className="flex-1 h-1 bg-zinc-600 rounded-full">
              <div 
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-zinc-400 hidden sm:block">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="hidden md:flex items-center gap-2 w-1/3 justify-end">
          <Volume2 size={20} className="text-zinc-400 hover:text-emerald-500 cursor-pointer" />
          <div className="w-24 h-1 bg-zinc-600 rounded-full">
            <div className="w-2/3 h-full bg-emerald-500 rounded-full" />
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
