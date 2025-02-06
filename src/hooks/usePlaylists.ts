import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cacheService } from '../services/cacheService';
import { Playlist, Track, PlaylistTrack } from '../types/interfaces';

interface PlaylistStore {
  playlists: Playlist[];
  activePlaylistId: string | null;
  createPlaylist: (name: string, description?: string) => Promise<Playlist>;
  deletePlaylist: (id: string) => void;
  duplicatePlaylist: (id: string) => Promise<Playlist>;
  addTrack: (playlistId: string, track: Track) => void;
  removeTrack: (playlistId: string, trackId: string) => void;
  reorderTracks: (playlistId: string, trackId: string, newPosition: number) => void;
  renamePlaylist: (id: string, newName: string) => void;
  setActivePlaylist: (id: string | null) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const createDefaultSettings = () => ({
  repeat: 'none' as const,
  shuffle: false,
  crossfade: false,
  crossfadeDuration: 2
});

export const usePlaylists = create<PlaylistStore>()(
  persist(
    (set, get) => ({
      playlists: [],
      activePlaylistId: null,

      setActivePlaylist: (id) => set({ activePlaylistId: id }),

      createPlaylist: async (name, description) => {
        const { playlists } = get();
        const normalizedName = name.trim();
        
        // Check for duplicate names
        if (playlists.some(p => p.name.toLowerCase() === normalizedName.toLowerCase())) {
          throw new Error('A playlist with this name already exists');
        }

        const newPlaylist: Playlist = {
          id: generateId(),
          name: normalizedName,
          description,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tracks: [],
          settings: createDefaultSettings()
        };

        set(state => ({
          playlists: [...state.playlists, newPlaylist]
        }));

        // Cache the playlist
        await cacheService.set('playlists', newPlaylist.id, newPlaylist);
        return newPlaylist;
      },

      deletePlaylist: (id) => {
        set(state => ({
          playlists: state.playlists.filter(p => p.id !== id),
          activePlaylistId: state.activePlaylistId === id ? null : state.activePlaylistId
        }));
        cacheService.del('playlists', id).catch(console.error);
      },

      duplicatePlaylist: async (id) => {
        const { playlists } = get();
        const playlist = playlists.find(p => p.id === id);
        
        if (!playlist) {
          throw new Error('Playlist not found');
        }

        const newPlaylist: Playlist = {
          ...playlist,
          id: generateId(),
          name: `${playlist.name} (Copy)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tracks: [...playlist.tracks]
        };

        set(state => ({
          playlists: [...state.playlists, newPlaylist]
        }));

        await cacheService.set('playlists', newPlaylist.id, newPlaylist);
        return newPlaylist;
      },

      addTrack: (playlistId, track) => {
        set(state => ({

          playlists: state.playlists.map(playlist => {
            if (playlist.id !== playlistId) return playlist;

            const playlistTrack: PlaylistTrack = {
              ...track,
              addedAt: Date.now(),
              playCount: 0,
              position: playlist.tracks.length
            };

            return {
              ...playlist,
              tracks: [...playlist.tracks, playlistTrack],
              updatedAt: Date.now()
            };
          })
        }));
      },

      removeTrack: (playlistId, trackId) => {
        set(state => ({
          playlists: state.playlists.map(playlist => {
            if (playlist.id !== playlistId) return playlist;

            return {
              ...playlist,
              tracks: playlist.tracks
                .filter(track => track.identifier !== trackId)
                .map((track, index) => ({ ...track, position: index })),
              updatedAt: Date.now()
            };
          })
        }));
      },

      reorderTracks: (playlistId, trackId, newPosition) => {
        set(state => ({
          playlists: state.playlists.map(playlist => {
            if (playlist.id !== playlistId) return playlist;

            const tracks = [...playlist.tracks];
            const oldIndex = tracks.findIndex(t => t.identifier === trackId);
            const [track] = tracks.splice(oldIndex, 1);
            tracks.splice(newPosition, 0, track);

            return {
              ...playlist,
              tracks: tracks.map((t, i) => ({ ...t, position: i })),
              updatedAt: Date.now()
            };
          })
        }));
      },

      renamePlaylist: (id, newName) => {
        set(state => ({
          playlists: state.playlists.map(playlist =>
            playlist.id === id
              ? { ...playlist, name: newName, updatedAt: Date.now() }
              : playlist
          )
        }));
      },
    }),
    {
      name: 'playlists-storage',
      skipHydration: true
    }
  )
);

// Initialize store after hydration
if (typeof window !== 'undefined') {
  usePlaylists.persist.rehydrate();
}
