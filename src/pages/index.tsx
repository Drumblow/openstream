import type { NextPage } from 'next';
import { SearchResults } from '../components/Search/SearchResults';
import { PlaylistView } from '../components/Playlist/PlaylistView';
import { useAppState } from '../hooks/useAppState';

const Home: NextPage = () => {
  const { view, currentPlaylistId } = useAppState();

  return (
    <main>
      {view === 'search' ? (
        <SearchResults 
          results={[]} 
          isLoading={false} 
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