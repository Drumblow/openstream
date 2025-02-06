import { create } from 'zustand';

type View = 'search' | 'playlist';

interface AppState {
  view: View;
  currentPlaylistId: string | null;
  setView: (view: View) => void;
  setCurrentPlaylist: (id: string | null) => void;
}

export const useAppState = create<AppState>((set) => ({
  view: 'search',
  currentPlaylistId: null,
  setView: (view) => set({ view }),
  setCurrentPlaylist: (id) => set({ currentPlaylistId: id }),
}));
