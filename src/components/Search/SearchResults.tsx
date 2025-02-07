import React, { useState, useEffect } from 'react';
import { SearchResult, Album, Track, MusicBrainzArtist } from '../../types/interfaces';
import { getTrackDetails, searchArtist as searchArchiveArtist } from '../../services/api';
import { searchArtist as searchMusicBrainzArtist, getArtistReleases } from '../../services/musicBrainzApi';
import { ArtistList } from './ArtistList';
import { ArtistReleases } from './ArtistReleases';
import { AlbumGrid } from './AlbumGrid';
// ...outros imports e hooks existentes...

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  query: string;
  start?: number;
  rows?: number;
  total?: number;
  onPageChange?: (start: number) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ 
  results, 
  isLoading: parentIsLoading, 
  query, 
  start = 0, 
  rows = 10, 
  total = 0, 
  onPageChange = () => {} 
}) => {
  // Log inicial
  console.log("SearchResults mounted with props:", { query, start, rows, total });
  
  // Converta explicitamente start e rows para números (caso venham como string)
  const numericStart = Number(start);
  const numericRows = Number(rows);
  
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [loadingAlbum, setLoadingAlbum] = useState(false);
  const [error, setError] = useState<string>('');
  const [localIsLoading, setLocalIsLoading] = useState(false);
  const [artists, setArtists] = useState<MusicBrainzArtist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<MusicBrainzArtist | null>(null);
  const [releases, setReleases] = useState<any[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [archiveResults, setArchiveResults] = useState<SearchResult[]>([]);
  const [archiveTotal, setArchiveTotal] = useState(0);

  // Lógica de buscas permanece, sem alterações
  useEffect(() => {
    if (!query) return;
    setLocalIsLoading(true);
    searchMusicBrainzArtist(query, { offset: numericStart, limit: numericRows })
      .then(data => {
        setArtists(data.artists);
        setTotalResults(data.count);
      })
      .catch(err => console.error("Erro na MusicBrainz:", err))
      .finally(() => setLocalIsLoading(false));
  }, [query, numericStart, numericRows]);

  useEffect(() => {
    if (!query) return;
    setLocalIsLoading(true);
    searchArchiveArtist(query, { start: numericStart, rows: numericRows })
      .then(data => {
        setArchiveResults(data.results);
        setArchiveTotal(data.count);
      })
      .catch(err => console.error("Erro no Archive:", err))
      .finally(() => setLocalIsLoading(false));
  }, [query, numericStart, numericRows]);

  useEffect(() => {
    if (selectedArtist) {
      setLocalIsLoading(true);
      getArtistReleases(selectedArtist.id)
        .then(data => setReleases(data.releases))
        .catch(console.error)
        .finally(() => setLocalIsLoading(false));
    }
  }, [selectedArtist]);

  const handleAlbumClick = async (identifier: string) => {
    setLoadingAlbum(true);
    setError('');
    try {
      const albumData = await getTrackDetails(identifier);
      if (!albumData.tracks?.length) {
        setError('Este álbum não contém faixas disponíveis');
        return;
      }
      setSelectedAlbum(albumData);
    } catch (error: any) {
      setError(
        error.response?.data?.error?.message ||
        error.message ||
        'Erro ao carregar o álbum'
      );
    } finally {
      setLoadingAlbum(false);
    }
  };

  const handleArtistSelect = (artist: MusicBrainzArtist) => {
    setSelectedArtist(artist);
    setLocalIsLoading(true);
    getArtistReleases(artist.id)
      .then(data => setReleases(data.releases))
      .catch(console.error)
      .finally(() => setLocalIsLoading(false));
  };

  // UNIÃO dos resultados com verificação de segurança
  const combinedResults = [...(results || []), ...(archiveResults || [])];
  const effectiveTotal = Math.max(totalResults, total, archiveTotal);

  // Transformar os resultados com verificação de segurança
  const formattedResults = combinedResults.map(result => ({
    identifier: result?.id || '',
    title: result?.title || '',
    creator: result?.artist || '',
    coverArt: result?.coverArt || null
  })).filter(result => result.identifier || result.title); // Remove resultados vazios

  return (
    <div className="space-y-8">
      {error && (
        // ...existing error code...
        <div className="bg-red-500/10 border border-red-500 p-4 rounded-lg text-red-500">
          {error}
        </div>
      )}

      {/* Lista de Artistas */}
      <ArtistList 
        artists={artists} 
        onArtistSelect={handleArtistSelect}
        isLoading={localIsLoading}
      />

      {/* Releases do artista selecionado */}
      {selectedArtist && (
        <ArtistReleases
          releases={releases}
          artistName={selectedArtist.name}
        />
      )}

      {/* Grid de Álbuns com verificação de dados */}
      {formattedResults.length > 0 && (
        <AlbumGrid 
          albums={formattedResults}
          onAlbumClick={handleAlbumClick}
        />
      )}

      {/* ...existing loading, paginação e detalhes do álbum... */}
      {/* Exemplo: Loading */}
      {(parentIsLoading || localIsLoading) && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      )}
      
      {/* Botões de paginação */}
      <div className="flex justify-between items-center mt-4">
        <button onClick={() => onPageChange(numericStart - numericRows)} disabled={numericStart === 0}>
          Previous
        </button>
        <span>
          Page {Math.ceil(numericStart / numericRows) + 1} of {Math.ceil(effectiveTotal / numericRows)}
        </span>
        <button onClick={() => onPageChange(numericStart + numericRows)} disabled={numericStart + numericRows >= effectiveTotal}>
          Next
        </button>
      </div>
    </div>
  );
};
