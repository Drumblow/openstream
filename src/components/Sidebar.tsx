import React from 'react';
import { Home, Grid, User2, List, LogOut, Heart, Play, X } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { usePlayer } from '../hooks/usePlayer';

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
  const { favorites } = useFavorites();
  const { playTrack } = usePlayer();
  const favoritesCount = favorites.length;

  const handlePlayFavorite = (index: number) => {
    const track = favorites[index];
    // Reproduz a faixa selecionada e configura a playlist como todos os favoritos
    playTrack(track, favorites);
  };

  const handlePlayAllFavorites = () => {
    if (favorites.length > 0) {
      playTrack(favorites[0], favorites);
    }
  };

  return (
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
        <div className="flex items-center gap-2 mb-4">
          <List size={20} />
          <span>Playlists</span>
        </div>
        {playlists.map((playlist, index) => (
          <button key={index} className="flex items-center gap-3 p-3 w-full hover:bg-zinc-800 rounded-lg">
            <span className="w-6 h-6 flex items-center justify-center">{playlist.icon}</span>
            <span>{playlist.name}</span>
          </button>
        ))}
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
  );
};
