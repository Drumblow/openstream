import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Heart } from 'lucide-react';
import { useAppState } from '../hooks/useAppState';
import { SearchResult, Album, Track } from '../types/interfaces';
import { getTrackDetails } from '../services/api';
import { usePlayer } from '../hooks/usePlayer';
import { useFavorites } from '../hooks/useFavorites';

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ results, isLoading }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedAlbum, setSelectedAlbum] = React.useState<Album | null>(null);
  const [loadingAlbum, setLoadingAlbum] = React.useState(false);
  const { setCurrentTrack } = usePlayer();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const handleAlbumClick = async (identifier: string) => {
    setLoadingAlbum(true);
    try {
      const albumData = await getTrackDetails(identifier);
      setSelectedAlbum(albumData);
    } catch (error) {
      console.error('Failed to load album:', error);
    } finally {
      setLoadingAlbum(false);
    }
  };

  const handleTrackClick = (track: Track) => {
    setCurrentTrack(track);
  };

  const handleFavoriteClick = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    if (isFavorite(track.identifier)) {
      removeFavorite(track.identifier);
    } else {
      addFavorite(track);
    }
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
                className="flex items-center gap-4 p-3 hover:bg-zinc-700/50 rounded-lg group cursor-pointer"
                onClick={() => handleTrackClick(track)}
              >
                <span className="text-zinc-500 w-8 text-center">{index + 1}</span>
                <Play className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex-1">
                  <p className="font-medium">{track.title}</p>
                  {track.duration && (
                    <p className="text-sm text-zinc-500">
                      {Math.floor(track.duration / 60)}:
                      {Math.floor(track.duration % 60).toString().padStart(2, '0')}
                    </p>
                  )}
                </div>
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
