import { useEffect, useRef, useCallback } from 'react';
import { Howl, Howler } from 'howler';
import { Track } from '../types/interfaces';
import { logger } from '../services/logger';

interface UseAudioPlayerProps {
  onPlaybackEnd?: () => void;
  onPlaybackError?: (error: string) => void;
  onLoad?: (duration: number) => void;
}

interface AudioError {
  type: string;
  message: string;
  code?: number;
}

export function useAudioPlayer({ onPlaybackEnd, onPlaybackError, onLoad }: UseAudioPlayerProps = {}) {
  const soundRef = useRef<Howl | null>(null);
  const loadingRef = useRef(false);
  const hasInteractedRef = useRef(false);

  const handleError = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error occurred';
  };

  const cleanup = useCallback(() => {
    if (soundRef.current) {
      soundRef.current.unload();
      soundRef.current = null;
    }
    loadingRef.current = false;
  }, []);

  const loadTrack = useCallback((track: Track, initialVolume: number = 1) => {
    if (loadingRef.current) {
      logger.warn('Already loading a track');
      return;
    }

    cleanup();
    loadingRef.current = true;
    logger.info('Creating new Howl instance', { track });

    const sound = new Howl({
      src: [track.streamUrl],
      html5: true,
      autoplay: false, // Disable autoplay
      preload: true,
      volume: initialVolume,
      format: ['mp3'],
      onload: () => {
        loadingRef.current = false;
        const duration = sound.duration();
        logger.info('Track loaded successfully', { duration });
        onLoad?.(duration);
      },
      onend: () => {
        logger.info('Track ended naturally');
        onPlaybackEnd?.();
      },
      onloaderror: (_, error) => {
        loadingRef.current = false;
        const errorMessage = handleError(error);
        logger.error('Load error:', errorMessage);
        onPlaybackError?.(errorMessage);
      },
      onplayerror: (_, error) => {
        loadingRef.current = false;
        const errorMessage = handleError(error);
        logger.error('Play error:', errorMessage);
        if (errorMessage.includes('user interaction')) {
          onPlaybackError?.('Click play to start playback');
        } else {
          onPlaybackError?.('Playback error occurred');
        }
      }
    });

    soundRef.current = sound;
    return sound;
  }, [cleanup, onLoad, onPlaybackEnd, onPlaybackError]);

  const controls = {
    play: useCallback(() => {
      if (!soundRef.current) return;

      hasInteractedRef.current = true;
      logger.info('Play requested by user');

      try {
        soundRef.current.play();
      } catch (error) {
        logger.error('Play failed:', error);
        onPlaybackError?.('Failed to play audio');
      }
    }, [onPlaybackError]),

    pause: useCallback(() => {
      logger.info('Pause requested');
      soundRef.current?.pause();
    }, []),

    seek: useCallback((time: number) => {
      if (soundRef.current) {
        soundRef.current.seek(time);
      }
    }, []),

    setVolume: useCallback((volume: number) => {
      if (soundRef.current) {
        const normalizedVolume = Math.max(0, Math.min(1, volume));
        soundRef.current.volume(normalizedVolume);
      }
    }, []),

    getCurrentTime: useCallback(() => {
      return soundRef.current?.seek() as number || 0;
    }, [])
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUserInteraction = () => {
      try {
        Howler.ctx?.resume().catch(error => {
          logger.error('Failed to resume audio context:', handleError(error));
        });
      } catch (error) {
        logger.error('Error handling user interaction:', handleError(error));
      }
    };

    window.document.addEventListener('click', handleUserInteraction, { once: true });
    window.document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      window.document.removeEventListener('click', handleUserInteraction);
      window.document.removeEventListener('touchstart', handleUserInteraction);
      cleanup();
    };
  }, [cleanup]);

  return {
    loadTrack,
    controls,
    isLoading: () => loadingRef.current
  };
}
