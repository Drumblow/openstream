import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { SearchResults } from '../components/Search/SearchResults';
import { PlaylistView } from '../components/Playlist/PlaylistView';
import { useAppState } from '../hooks/useAppState';
import { searchArtist } from '../services/api';

const Home: NextPage = () => {
  const { view, currentPlaylistId } = useAppState();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [start, setStart] = useState(0);
  const [total, setTotal] = useState(0);
  const ROWS_PER_PAGE = 10;

  useEffect(() => {
    if (query) {
      setIsLoading(true);
      searchArtist(query, { start, rows: ROWS_PER_PAGE })
        .then((data: any) => {
          setResults(data.results || []);
          setTotal(data.total || 0);
        })
        .catch((error: Error) => {
          console.error('Search error:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [query, start]);

  const handlePageChange = (newStart: number) => {
    setStart(newStart);
  };

  return (
    <main>
      {view === 'search' ? (
        <SearchResults 
          results={results} 
          isLoading={isLoading}
          query={query}
          start={start}
          rows={ROWS_PER_PAGE}
          total={total}
          onPageChange={handlePageChange}
        />
      ) : view === 'playlist' && currentPlaylistId ? (
        <PlaylistView 
          playlistId={currentPlaylistId} 
          onBack={() => {
            const { setView } = useAppState.getState();
            setView('search');
          }}
        />
      ) : null}
    </main>
  );
};

export default Home;