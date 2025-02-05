import React, { useEffect, useState } from 'react';
import { Album } from '../types/interfaces';
import { getTrackDetails } from '../services/api';
import { useAppState } from '../hooks/useAppState';

interface AlbumViewProps {
  identifier: string;
}

export const AlbumView: React.FC<AlbumViewProps> = ({ identifier }) => {
  const [album, setAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setView } = useAppState();

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
          
          <div className="space-y-2">
            {album.tracks.map((track, index) => (
              <div
                key={track.identifier}
                className="flex items-center gap-4 p-3 hover:bg-zinc-800 rounded-lg group"
              >
                <span className="text-zinc-500 w-8 text-right">{index + 1}</span>
                <div className="flex-1">
                  <h3 className="font-medium">{track.title}</h3>
                  {track.duration && (
                    <p className="text-sm text-zinc-500">
                      {Math.round(track.duration)}s
                    </p>
                  )}
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  ▶️
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
