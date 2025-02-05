import { create } from 'zustand';
import { Track } from '../types/interfaces';

interface PlayerStore {
  currentTrack: Track | null;
  playlist: Track[];
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  setCurrentTrack: (track: Track) => void;
  setPlaylist: (tracks: Track[]) => void;
  playTrack: (track: Track, playlist?: Track[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  togglePlayPause: () => void;
}

export const usePlayer = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  playlist: [],
  isPlaying: false,
  volume: 1,
  progress: 0,
  duration: 0,
  setCurrentTrack: (track) => set({ currentTrack: track, isPlaying: true, progress: 0 }),
  setPlaylist: (tracks) => set({ playlist: tracks }),
  playTrack: (track, playlist) => {
    if (playlist) {
      set({ playlist, currentTrack: track, isPlaying: true, progress: 0 });
    } else {
      set({ currentTrack: track, isPlaying: true, progress: 0 });
    }
  },
  playNext: () => {
    const { currentTrack, playlist } = get();
    if (!currentTrack || playlist.length === 0) return;

    const currentIndex = playlist.findIndex(t => t.identifier === currentTrack.identifier);
    const nextTrack = playlist[currentIndex + 1];
    if (nextTrack) {
      set({ currentTrack: nextTrack, progress: 0 });
    }
  },
  playPrevious: () => {
    const { currentTrack, playlist } = get();
    if (!currentTrack || playlist.length === 0) return;

    const currentIndex = playlist.findIndex(t => t.identifier === currentTrack.identifier);
    const previousTrack = playlist[currentIndex - 1];
    if (previousTrack) {
      set({ currentTrack: previousTrack, progress: 0 });
    }
  },
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),
}));
