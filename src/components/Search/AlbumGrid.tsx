import React from 'react';
import { Music } from 'lucide-react';

interface AlbumGridProps {
  albums: {
    identifier: string;
    title: string;
    creator?: string;
    coverArt?: {
      small: string;
      medium: string;
      large: string;
    } | null;
  }[];
  onAlbumClick: (identifier: string) => void;
}

export const AlbumGrid: React.FC<AlbumGridProps> = ({ albums, onAlbumClick }) => {
  if (!albums?.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {albums.map(album => {
        const uniqueKey = album.identifier || `album-${album.title}-${Math.random()}`;
        
        return (
          <div
            key={uniqueKey}
            className="flex-none w-[160px] sm:w-[200px] snap-start bg-zinc-800 rounded-lg p-4 hover:bg-zinc-700 transition-all cursor-pointer transform hover:scale-105"
            onClick={() => onAlbumClick(album.identifier)}
          >
            <div className="aspect-square mb-3 bg-zinc-700 rounded-lg overflow-hidden">
              {album.coverArt?.small ? (
                <img
                  src={album.coverArt.small}
                  alt={album.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    console.log('Error loading image:', album.coverArt?.small);
                    e.currentTarget.src = '/album-placeholder.png';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music size={40} className="text-zinc-600" />
                </div>
              )}
            </div>
            <h3 className="font-semibold truncate">{album.title}</h3>
            <p className="text-sm text-zinc-400 truncate">
              {album.creator || 'Unknown Artist'}
            </p>
          </div>
        );
      })}
    </div>
  );
};
