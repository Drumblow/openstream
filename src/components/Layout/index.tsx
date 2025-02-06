import React, { useState } from 'react';
import { Search as SearchIcon, Settings, Menu, X } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { PlayerBar } from './components/PlayerBar';
import { SearchResults } from '../Search/SearchResults';
import { useAppState } from '../../hooks/useAppState';
import { searchByArtist } from '../../services/api';
import { DebugPanel } from '../Common/DebugPanel';
import { PlaylistView } from '../Playlist/PlaylistView';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { view, currentPlaylistId, setView } = useAppState();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const response = await searchByArtist(searchQuery);
      setSearchResults(response.response.docs);
    } catch (error) {
      console.error('Search failed:', error);
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-zinc-900 min-h-screen text-white">
      <button 
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-800 rounded-lg"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className="flex h-screen">
        <div className={`
          fixed inset-0 lg:relative
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out
          bg-zinc-900 lg:bg-transparent
          z-40 lg:z-auto
          w-64 flex-shrink-0
        `}>
          <Sidebar className="h-full p-4" onClose={() => setSidebarOpen(false)} />
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
          <div className="p-4 border-b border-zinc-800">
            <div className="flex justify-between items-center">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search for artists or albums..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-4 pl-12"
                />
                <SearchIcon className="absolute left-4 top-2.5 text-zinc-400" size={20} />
              </div>
              <Settings className="text-zinc-400 hover:text-white cursor-pointer ml-4" size={20} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {view === 'search' ? (
              <SearchResults 
                results={searchResults}
                isLoading={isLoading}
              />
            ) : view === 'playlist' && currentPlaylistId ? (
              <PlaylistView 
                playlistId={currentPlaylistId}
                onBack={() => setView('search')}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <PlayerBar />
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <DebugPanel />
    </div>
  );
};