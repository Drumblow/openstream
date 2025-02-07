import React from 'react';
import { MusicBrainzRelease } from '../../types/interfaces';

interface ArtistReleasesProps {
  releases: MusicBrainzRelease[];
  artistName: string;
}

export const ArtistReleases: React.FC<ArtistReleasesProps> = ({ releases, artistName }) => {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">{artistName}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {releases.map(release => (
          <div key={release.id} className="bg-zinc-800 p-4 rounded-lg">
            {release.coverArt && (
              <img 
                src={release.coverArt.small} 
                alt={release.title}
                className="w-full aspect-square object-cover rounded mb-2"
              />
            )}
            <h4 className="font-medium truncate">{release.title}</h4>
            <p className="text-sm text-zinc-400">{release.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
