import React, { useState } from 'react';
import { Home, Grid, User2, List, LogOut, Heart, Play, X, Plus, Trash2, Edit2 } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { usePlayer } from '../hooks/usePlayer';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePlaylists } from '../hooks/usePlaylists';
import { CreatePlaylistModal } from './Playlist/CreatePlaylistModal';
import { useAppState } from '../hooks/useAppState';

const playlists = [
  { name: 'Favorites', icon: '❤️' },
  { name: 'Recently Played', icon: '🕒' },
  { name: 'Most Played', icon: '🔥' }
];

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className, onClose }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const { favorites } = useFavorites();
  const { setCurrentTrack } = usePlayer();
  const router = useRouter();
  const favoritesCount = favorites.length;
  const { playlists, createPlaylist, deletePlaylist, renamePlaylist } = usePlaylists();
  const { setView, setCurrentPlaylist } = useAppState();

  const handlePlayFavorite = (index: number) => {
    const track = favorites[index];
    // Reproduz a faixa selecionada e configura a playlist como todos os favoritos
    setCurrentTrack(track, favorites);
  };

  const handlePlayAllFavorites = () => {
    if (favorites.length > 0) {
      setCurrentTrack(favorites[0], favorites);
    }
  };

  const handleCreatePlaylist = () => {
    createPlaylist('Nova Playlist').then(() => {
      // Redirecionar para a página de playlists
      window.location.href = '/playlists';
    });
  };

  const handleStartEdit = (playlist: { id: string, name: string }) => {
    setEditingPlaylistId(playlist.id);
    setEditingName(playlist.name);
  };

  const handleSaveEdit = (playlistId: string) => {
    if (editingName.trim()) {
      renamePlaylist(playlistId, editingName.trim());
    }
    setEditingPlaylistId(null);
    setEditingName('');
  };

  const handlePlaylistClick = (playlistId: string) => {
    setCurrentPlaylist(playlistId);
    setView('playlist');
  };

  return (
    <>
      <div className={`w-64 flex flex-col gap-8 ${className}`}>
        {/* Mobile close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-zinc-800 lg:hidden"
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg"></div>
          <span className="text-xl font-semibold">OpenStream</span>
        </div>

        <nav className="flex flex-col gap-4">
          <button className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
            <Home size={20} />
            <span>Home</span>
          </button>
          <button className="flex items-center gap-3 p-3 hover:bg-zinc-800 rounded-lg">
            <Grid size={20} />
            <span>Browse</span>
          </button>
          <button className="flex items-center gap-3 p-3 hover:bg-zinc-800 rounded-lg">
            <User2 size={20} />
            <span>Artists</span>
          </button>
        </nav>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <List size={20} />
              <span>Playlists</span>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="p-2 hover:bg-zinc-800 rounded-lg"
              title="Create new playlist"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-2">
            {playlists.map(playlist => (
              <div
                key={playlist.id}
                className="flex items-center justify-between group hover:bg-zinc-800 rounded-lg px-2 py-1"
              >
                {editingPlaylistId === playlist.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleSaveEdit(playlist.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(playlist.id);
                      if (e.key === 'Escape') {
                        setEditingPlaylistId(null);
                        setEditingName('');
                      }
                    }}
                    className="flex-1 bg-zinc-700 px-2 py-1 rounded text-sm text-zinc-100"
                    autoFocus
                  />
                ) : (
                  <>
                    <button
                      onClick={() => handlePlaylistClick(playlist.id)}
                      className="flex-1 text-sm text-zinc-400 hover:text-zinc-100 transition-colors truncate text-left"
                    >
                      {playlist.name}
                    </button>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStartEdit(playlist);
                        }}
                        className="p-1 hover:bg-zinc-700 rounded-full"
                      >
                        <Edit2 size={14} className="text-zinc-400 hover:text-emerald-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this playlist?')) {
                            deletePlaylist(playlist.id);
                          }
                        }}
                        className="p-1 hover:bg-zinc-700 rounded-full ml-1"
                      >
                        <Trash2 size={14} className="text-zinc-400 hover:text-red-400" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart size={20} />
              <span>Favoritos</span>
              <span className="text-sm text-zinc-400">({favoritesCount})</span>
            </div>
            {favoritesCount > 0 && (
              <button
                onClick={handlePlayAllFavorites}
                className="p-2 hover:bg-zinc-800 rounded-full"
              >
                <Play size={16} />
              </button>
            )}
          </div>
          <div className="space-y-1">
            {favorites.map((track, index) => (
              <button
                key={track.identifier}
                onClick={() => handlePlayFavorite(index)}
                className="flex items-center gap-3 p-3 w-full hover:bg-zinc-800 rounded-lg text-left group"
              >
                <span className="text-sm truncate flex-1">{track.title}</span>
                <Play size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        <button className="flex items-center gap-3 p-3 mt-auto hover:bg-zinc-800 rounded-lg">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      <CreatePlaylistModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
};
