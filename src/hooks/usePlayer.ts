import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '../types/interfaces';
import { cacheService } from '../services/cacheService';
import { audioManager } from '../services/audioManager';

interface PlayerStore {
  currentTrack: Track | null;
  currentAlbumTracks: Track[];
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  setCurrentTrack: (track: Track, albumTracks?: Track[]) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  togglePlayPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
}

// Initialize volume synchronously for initial state
const getInitialVolume = () => {
  if (typeof window === 'undefined') return 1;
  try {
    const stored = localStorage.getItem('playerVolume');
    return stored ? parseFloat(stored) : 1;
  } catch {
    return 1;
  }
};

export const usePlayer = create<PlayerStore>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      currentAlbumTracks: [],
      isPlaying: false,
      volume: getInitialVolume(),
      progress: 0,
      duration: 0,

      setCurrentTrack: (track, albumTracks = []) => {
        audioManager.initialize().then(() => {
          set({
            currentTrack: track,
            currentAlbumTracks: albumTracks,
            isPlaying: true,
            progress: 0
          });
        });
      },

      setIsPlaying: (isPlaying) => set({ isPlaying }),

      setVolume: (volume) => {
        const normalizedVolume = Math.max(0, Math.min(1, volume));
        if (typeof window !== 'undefined') {
          localStorage.setItem('playerVolume', normalizedVolume.toString());
          cacheService.set('settings', 'playerVolume', normalizedVolume)
            .catch(console.error);
        }
        set({ volume: normalizedVolume });
      },

      setProgress: (progress) => set({ progress }),
      
      setDuration: (duration) => set({ duration }),

      togglePlayPause: () => {
        set(state => ({ isPlaying: !state.isPlaying }));
      },

      playNext: () => {
        const { currentTrack, currentAlbumTracks } = get();
        if (!currentTrack || currentAlbumTracks.length === 0) return;

        const currentIndex = currentAlbumTracks.findIndex(
          track => track.identifier === currentTrack.identifier
        );
        const nextTrack = currentAlbumTracks[currentIndex + 1];
        
        if (nextTrack) {
          set({
            currentTrack: nextTrack,
            progress: 0,
            isPlaying: true
          });
        }
      },

      playPrevious: () => {
        const { currentTrack, currentAlbumTracks } = get();
        if (!currentTrack || currentAlbumTracks.length === 0) return;

        const currentIndex = currentAlbumTracks.findIndex(
          track => track.identifier === currentTrack.identifier
        );
        const previousTrack = currentAlbumTracks[currentIndex - 1];
        
        if (previousTrack) {
          set({
            currentTrack: previousTrack,
            progress: 0,
            isPlaying: true
          });
        }
      }
    }),
    {
      name: 'player-storage',
      skipHydration: true,
      partialize: (state) => ({
        volume: state.volume,
      })
    }
  )
);

// Initialize store after hydration
if (typeof window !== 'undefined') {
  usePlayer.persist.rehydrate();
}
