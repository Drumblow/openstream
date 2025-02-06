import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Heart, Plus } from 'lucide-react';
import { useAppState } from '../../hooks/useAppState';
import { SearchResult, Album, Track } from '../../types/interfaces';
import { getTrackDetails } from '../../services/api';
import { usePlayer } from '../../hooks/usePlayer';
import { useFavorites } from '../../hooks/useFavorites';
import { usePlaylists } from '../../hooks/usePlaylists';
import { toast } from '../../services/toastService';

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ results, isLoading }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedAlbum, setSelectedAlbum] = React.useState<Album | null>(null);
  const [loadingAlbum, setLoadingAlbum] = React.useState(false);
  const [error, setError] = React.useState<string>('');
  const { setCurrentTrack } = usePlayer();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { playlists, addTrack } = usePlaylists();
  const [showPlaylistMenu, setShowPlaylistMenu] = useState<string | null>(null);

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
      const errorMessage = error.response?.data?.error?.message 
        || error.message 
        || 'Erro ao carregar o álbum';
      
      setError(errorMessage);
      console.error('Failed to load album:', error);
    } finally {
      setLoadingAlbum(false);
    }
  };

  const handleTrackClick = (track: Track) => {
    if (selectedAlbum) {
      setCurrentTrack(track, selectedAlbum.tracks);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    if (isFavorite(track.identifier)) {
      removeFavorite(track.identifier);
    } else {
      addFavorite(track);
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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const newScrollPosition = scrollContainerRef.current.scrollLeft + 
        (direction === 'left' ? -scrollAmount : scrollAmount);
      
      scrollContainerRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-500/10 border border-red-500 p-4 rounded-lg text-red-500">
          {error}
        </div>
      )}
      {/* Albums Carousel */}
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 bg-zinc-800/80 p-2 rounded-full hidden md:block"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-zinc-800/80 p-2 rounded-full hidden md:block"
        >
          <ChevronRight />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-4 pb-4 px-4 scrollbar-hide scroll-smooth snap-x snap-mandatory"
        >
          {results.map((result) => (
            <div
              key={result.identifier}
              className="flex-none w-[160px] sm:w-[200px] snap-start bg-zinc-800 rounded-lg p-4 hover:bg-zinc-700 
                     transition-all cursor-pointer transform hover:scale-105"
              onClick={() => handleAlbumClick(result.identifier)}
            >
              <div className="aspect-square mb-3 bg-zinc-700 rounded-lg overflow-hidden">
                <img
                  src={`https://archive.org/services/img/${result.identifier}`}
                  alt={result.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/album-placeholder.png';
                  }}
                />
              </div>
              <h3 className="font-semibold truncate">{result.title}</h3>
              <p className="text-sm text-zinc-400 truncate">
                {result.creator || 'Unknown Artist'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Album Details */}
      {loadingAlbum ? (
        <div className="text-center text-zinc-400">Loading album...</div>
      ) : selectedAlbum && (
        <div className="bg-zinc-800 rounded-lg p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-6">
            <img
              src={selectedAlbum.coverUrl}
              alt={selectedAlbum.title}
              className="w-full md:w-48 h-48 object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.src = '/album-placeholder.png';
              }}
            />
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold mb-2">{selectedAlbum.title}</h2>
              <p className="text-zinc-400 mb-4">{selectedAlbum.creator}</p>
              <p className="text-sm text-zinc-500">{selectedAlbum.year}</p>
            </div>
          </div>

          <div className="space-y-1">
            {selectedAlbum.tracks.map((track, index) => (
              <div
                key={track.identifier}
                className="flex items-center gap-4 p-3 hover:bg-zinc-700/50 rounded-lg group relative"
                onClick={() => handleTrackClick(track)}
              >
                <span className="text-zinc-500 w-8 text-center">{index + 1}</span>
                <Play className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                <div className="flex-1">
                  <p className="font-medium">{track.title}</p>
                  {track.duration && (
                    <p className="text-sm text-zinc-500">
                      {Math.floor(track.duration / 60)}:
                      {Math.floor(track.duration % 60).toString().padStart(2, '0')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPlaylistMenu(track.identifier);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Plus size={16} className="text-zinc-400 hover:text-emerald-500" />
                  </button>

                  <button
                    onClick={(e) => handleFavoriteClick(e, track)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart
                      size={16}
                      className={`${
                        isFavorite(track.identifier)
                          ? 'fill-emerald-500 text-emerald-500'
                          : 'text-zinc-400 hover:text-emerald-500'
                      } transition-colors`}
                    />
                  </button>
                </div>

                {showPlaylistMenu === track.identifier && (
                  <div 
                    className="absolute right-0 top-full mt-1 w-48 bg-zinc-800 rounded-lg shadow-lg py-1 z-50"
                    onClick={e => e.stopPropagation()}
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
      )}
    </div>
  );
};
