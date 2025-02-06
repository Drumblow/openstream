import React, { useEffect, useState } from 'react';
import { Album, Track } from '../../types/interfaces';
import { getTrackDetails } from '../../services/api';
import { useAppState } from '../../hooks/useAppState';
import { usePlayer } from '../../hooks/usePlayer';
import { Play, Heart, Plus } from 'lucide-react';
import { useFavorites } from '../../hooks/useFavorites';
import { usePlaylists } from '../../hooks/usePlaylists';
import { toast } from '../../services/toastService';

interface AlbumViewProps {
  identifier: string;
}

export const AlbumView: React.FC<AlbumViewProps> = ({ identifier }) => {
  const [album, setAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setView } = useAppState();
  const { setCurrentTrack } = usePlayer();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { playlists, addTrack } = usePlaylists();
  const [showPlaylistMenu, setShowPlaylistMenu] = useState<string | null>(null);

  useEffect(() => {
    const loadAlbum = async () => {
      try {
        const data = await getTrackDetails(identifier);
        setAlbum(data);
      } catch (error) {
        console.error('Failed to load album:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAlbum();
  }, [identifier]);

  const handleTrackSelect = (selectedTrack: Track) => {
    if (album) {
      setCurrentTrack(selectedTrack, album.tracks);
    }
  };

  const handleAddToPlaylist = (track: Track, playlistId: string) => {
    addTrack(playlistId, track);
    toast({
      title: 'Success',
      description: 'Track added to playlist',
      type: 'success'
    });
    setShowPlaylistMenu(null);
  };

  if (isLoading) {
    return <div className="text-center text-zinc-400">Loading album...</div>;
  }

  if (!album) {
    return <div className="text-center text-zinc-400">Album not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={() => setView('search')}
        className="mb-6 text-zinc-400 hover:text-white"
      >
        ← Back to search
      </button>

      <div className="flex gap-8">
        <div className="w-64 flex-shrink-0">
          <img
            src={album.coverUrl}
            alt={album.title}
            className="w-full rounded-lg shadow-lg bg-zinc-800"
            onError={(e) => {
              e.currentTarget.src = '/album-placeholder.png';
            }}
          />
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{album.title}</h1>
          <p className="text-xl text-zinc-400 mb-6">{album.creator}</p>
          
          <div className="mt-6 space-y-2">
            {album?.tracks.map((track, index) => (
              <div
                key={track.identifier}
                className="flex items-center gap-4 p-3 hover:bg-zinc-700/50 rounded-lg group"
              >
                <span className="text-zinc-500 w-8 text-center">{index + 1}</span>
                <Play 
                  className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" 
                  onClick={() => handleTrackSelect(track)}
                />
                
                <div className="flex-1">
                  <p className="font-medium">{track.title}</p>
                  {track.duration && (
                    <p className="text-sm text-zinc-500">
                      {Math.floor(track.duration / 60)}:
                      {Math.floor(track.duration % 60).toString().padStart(2, '0')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setShowPlaylistMenu(track.identifier)}
                    className="p-2 hover:bg-zinc-700 rounded-full"
                  >
                    <Plus size={16} className="text-zinc-400 hover:text-emerald-500" />
                  </button>

                  <button
                    onClick={() => {
                      if (isFavorite(track.identifier)) {
                        removeFavorite(track.identifier);
                      } else {
                        addFavorite(track);
                      }
                    }}
                    className="p-2 hover:bg-zinc-700 rounded-full"
                  >
                    <Heart
                      size={16}
                      className={isFavorite(track.identifier) ? 'fill-emerald-500 text-emerald-500' : 'text-zinc-400 hover:text-emerald-500'}
                    />
                  </button>
                </div>

                {showPlaylistMenu === track.identifier && (
                  <div 
                    className="absolute right-8 mt-2 w-56 bg-zinc-800 rounded-lg shadow-lg py-1 z-50"
                  >
                    {playlists.map(playlist => (
                      <button
                        key={playlist.id}
                        onClick={() => handleAddToPlaylist(track, playlist.id)}
                        className="w-full px-4 py-2 text-sm text-left hover:bg-zinc-700 text-zinc-300"
                      >
                        {playlist.name}
                      </button>
                    ))}
                    {playlists.length === 0 && (
                      <div className="px-4 py-2 text-sm text-zinc-500">
                        No playlists created yet
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
