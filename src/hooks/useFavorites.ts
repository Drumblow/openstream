import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '../types/interfaces';

interface FavoritesStore {
  favorites: Track[];
  addFavorite: (track: Track) => void;
  removeFavorite: (trackId: string) => void;
  isFavorite: (trackId: string) => boolean;
}

export const useFavorites = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (track) => 
        set((state) => ({
          favorites: [...state.favorites, track]
        })),
      removeFavorite: (trackId) =>
        set((state) => ({
          favorites: state.favorites.filter((t) => t.identifier !== trackId)
        })),
      isFavorite: (trackId) =>
        get().favorites.some((t) => t.identifier === trackId)
    }),
    {
      name: 'favorites-storage'
    }
  )
);
