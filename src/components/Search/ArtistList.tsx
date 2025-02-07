import React from 'react';
import { Music } from 'lucide-react';
import { MusicBrainzArtist } from '../../types/interfaces';

interface ArtistListProps {
  artists: MusicBrainzArtist[];
  onArtistSelect: (artist: MusicBrainzArtist) => void;
  isLoading?: boolean;
}

export const ArtistList: React.FC<ArtistListProps> = ({ artists, onArtistSelect, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-zinc-800 aspect-square rounded-lg mb-2" />
            <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
            <div className="h-3 bg-zinc-800 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {artists.map((artist) => (
        <div
          key={artist.id}
          className="bg-zinc-800 p-4 rounded-lg cursor-pointer hover:bg-zinc-700 transition-all"
          onClick={() => onArtistSelect(artist)}
        >
          <div className="aspect-square mb-3 bg-zinc-700 rounded-lg overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <Music size={40} className="text-zinc-600" />
            </div>
          </div>
          <h3 className="font-medium truncate">{artist.name}</h3>
          <p className="text-sm text-zinc-400 truncate">{artist.type}</p>
        </div>
      ))}
    </div>
  );
};
