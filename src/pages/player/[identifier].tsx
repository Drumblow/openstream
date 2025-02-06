// src/pages/player/[identifier].tsx
import React from 'react';
import { useRouter } from 'next/router';
import { usePlayer } from '../../hooks/usePlayer';
import { getTrackDetails } from '../../services/api';

export default function PlayerPage() {
  const router = useRouter();
  const { identifier } = router.query;
  const { setCurrentTrack } = usePlayer();

  React.useEffect(() => {
    const loadTrack = async () => {
      if (identifier && typeof identifier === 'string') {
        try {
          const album = await getTrackDetails(identifier);
          if (album.tracks.length > 0) {
            setCurrentTrack(album.tracks[0], album.tracks);
          }
        } catch (error) {
          console.error('Error loading track:', error);
        }
      }
    };

    loadTrack();
  }, [identifier, setCurrentTrack]);

  return (
    <div className="container mx-auto p-4">
      <button 
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
      >
        ← Back
      </button>
    </div>
  );
}