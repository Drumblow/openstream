import React from 'react';
import { Play, Heart, Plus, Share2, Download, ListPlus } from 'lucide-react';
import { Track } from '../types/interfaces';
import { useFavorites } from '../hooks/useFavorites';
import { usePlaylists } from '../hooks/usePlaylists';
import { toast } from '../services/toastService';

interface TrackContextMenuProps {
  track: Track;
  position: { x: number; y: number };
  onClose: () => void;
  onPlay: () => void;
}

export const TrackContextMenu: React.FC<TrackContextMenuProps> = ({
  track,
  position,
  onClose,
  onPlay
}) => {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { playlists, addTrack } = usePlaylists();
  const [showPlaylists, setShowPlaylists] = React.useState(false);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.context-menu')) {
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  const handleAddToPlaylist = (playlistId: string) => {
    addTrack(playlistId, track);
    toast({
      title: 'Success',
      description: 'Track added to playlist',
      type: 'success'
    });
    onClose();
  };

  return (
    <div
      className="context-menu fixed bg-zinc-800 rounded-lg shadow-lg py-1 min-w-[200px] z-50"
      style={{ top: position.y, left: position.x }}
    >
      <button
        onClick={() => {
          onPlay();
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-zinc-700 flex items-center gap-2"
      >
        <Play size={16} />
        Play
      </button>

      <button
        onClick={() => {
          isFavorite(track.identifier)
            ? removeFavorite(track.identifier)
            : addFavorite(track);
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-zinc-700 flex items-center gap-2"
      >
        <Heart
          size={16}
          className={isFavorite(track.identifier) ? 'fill-emerald-500 text-emerald-500' : ''}
        />
        {isFavorite(track.identifier) ? 'Remove from Favorites' : 'Add to Favorites'}
      </button>

      <div className="relative">
        <button
          onClick={() => setShowPlaylists(!showPlaylists)}
          className="w-full px-4 py-2 text-left hover:bg-zinc-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Add to Playlist
        </button>

        {showPlaylists && (
          <div className="absolute left-full top-0 bg-zinc-800 rounded-lg shadow-lg py-1 min-w-[200px] -mt-1">
            {playlists.map(playlist => (
              <button
                key={playlist.id}
                onClick={() => handleAddToPlaylist(playlist.id)}
                className="w-full px-4 py-2 text-left hover:bg-zinc-700 truncate"
              >
                {playlist.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => {
          navigator.clipboard.writeText(track.streamUrl);
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-zinc-700 flex items-center gap-2"
      >
        <Share2 size={16} />
        Copy Link
      </button>

      <button
        onClick={() => {
          window.open(track.streamUrl, '_blank');
          onClose();
        }}
        className="w-full px-4 py-2 text-left hover:bg-zinc-700 flex items-center gap-2"
      >
        <Download size={16} />
        Download
      </button>
    </div>
  );
};
