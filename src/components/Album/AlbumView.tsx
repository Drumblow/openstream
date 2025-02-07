import React, { useEffect, useState } from 'react';
import { Album } from '../../types/interfaces';
import { getTrackDetails } from '../../services/api';
import { Play, Heart } from 'lucide-react';
import { usePlayer } from '../../hooks/usePlayer';
import { useFavorites } from '../../hooks/useFavorites';
import { formatDuration } from '../../utils/format';

interface AlbumViewProps {
  identifier: string;
  onBack?: () => void;
}

export const AlbumView: React.FC<AlbumViewProps> = ({ identifier, onBack }) => {
  const [album, setAlbum] = useState<Album | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { setCurrentTrack } = usePlayer();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  useEffect(() => {
    const loadAlbum = async () => {
      try {
        const data = await getTrackDetails(identifier);
        console.log('Album data:', data);
        setAlbum(data);
      } catch (err) {
        console.error('Failed to load album:', err);
        setError(err instanceof Error ? err.message : 'Failed to load album');
      } finally {
        setLoading(false);
      }
    };

    if (identifier) {
      loadAlbum();
    }
  }, [identifier]);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  if (!album) {
    return <div className="p-8 text-center">Album not found</div>;
  }

  return (
    <div className="p-8">
      <div className="flex gap-8">
        <div className="w-64 flex-shrink-0">
          <img
            src={album.coverUrl || '/album-placeholder.png'}
            alt={album.title}
            className="w-full aspect-square object-cover rounded-lg shadow-lg"
          />
        </div>

        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">{album.title}</h1>
          <p className="text-xl text-zinc-400 mb-4">{album.creator}</p>
          {album.year && (
            <p className="text-zinc-500 mb-6">{album.year}</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <div className="grid gap-2">
          {album.tracks.map((track, index) => (
            <div
              key={track.identifier}
              className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-lg group"
            >
              <span className="text-zinc-500 w-8 text-center">{track.track || index + 1}</span>
              
              <button
                onClick={() => setCurrentTrack(track, album.tracks)}
                className="p-2 hover:bg-zinc-700 rounded-full"
              >
                <Play size={16} className="text-zinc-400 group-hover:text-emerald-500" />
              </button>

              <div className="flex-1">
                <p className="font-medium">{track.title}</p>
                <p className="text-sm text-zinc-400">{track.artist || album.creator}</p>
              </div>

              <button
                onClick={() => {
                  if (isFavorite(track.identifier)) {
                    removeFavorite(track.identifier);
                  } else {
                    addFavorite(track);
                  }
                }}
                className="p-2 hover:bg-zinc-700 rounded-full opacity-0 group-hover:opacity-100"
              >
                <Heart
                  size={16}
                  className={isFavorite(track.identifier) ? 'fill-emerald-500 text-emerald-500' : 'text-zinc-400 hover:text-emerald-500'}
                />
              </button>

              {track.duration && (
                <span className="text-sm text-zinc-400 w-16 text-right">
                  {formatDuration(track.duration)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
