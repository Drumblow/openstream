import { create } from 'zustand';
import { StateCreator } from 'zustand';

type View = 'search' | 'album';

interface AppState {
  currentView: View;
  selectedAlbum: string | null;
  setView: (view: View) => void;
  setSelectedAlbum: (identifier: string | null) => void;
}

const store: StateCreator<AppState> = (set) => ({
  currentView: 'search',
  selectedAlbum: null,
  setView: (view: View) => set(() => ({ currentView: view })),
  setSelectedAlbum: (identifier: string | null) => set(() => ({ selectedAlbum: identifier }))
});

export const useAppState = create<AppState>(store);
