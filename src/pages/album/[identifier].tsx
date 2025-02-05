import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Album } from '../../types/interfaces';
import { getTrackDetails } from '../../services/api';

export default function AlbumPage() {
  const router = useRouter();
  const { identifier } = router.query;
  const [album, setAlbum] = useState<Album | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlbum = async () => {
      if (typeof identifier !== 'string') return;
      
      try {
        const data = await getTrackDetails(identifier);
        setAlbum(data);
      } catch (err) {
        setError('Erro ao carregar o álbum');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAlbum();
  }, [identifier]);

  if (loading) return <div className="p-4">Carregando...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!album) return <div className="p-4">Álbum não encontrado</div>;

  return (
    <div className="container mx-auto p-4">
      <button 
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-gray-500 text-white rounded"
      >
        Voltar
      </button>

      <div className="grid md:grid-cols-[300px,1fr] gap-8">
        <div>
          <img
            src={album.coverUrl}
            alt={album.title}
            className="w-full rounded shadow-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/album-placeholder.png';
            }}
          />
          <h1 className="text-2xl font-bold mt-4">{album.title}</h1>
          <p className="text-gray-600">{album.creator}</p>
          <p className="text-gray-500">{album.year}</p>
        </div>

        <div className="tracks-list">
          {album.tracks.map((track, index) => (
            <div
              key={track.identifier}
              className="track-item p-4 hover:bg-gray-50 flex items-center gap-4 border-b"
            >
              <span className="text-gray-400 w-8">{track.track || index + 1}</span>
              <div className="flex-grow">
                <h3 className="font-medium">{track.title}</h3>
                <p className="text-sm text-gray-500">
                  {track.duration ? Math.round(track.duration) + 's' : ''}
                </p>
              </div>
              <button
                onClick={() => router.push(`/player/${album.identifier}?track=${encodeURIComponent(track.streamUrl)}`)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Tocar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
