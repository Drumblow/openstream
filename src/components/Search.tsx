import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Music } from 'lucide-react';
import { SearchResult } from '../types/interfaces';
import { searchByArtist } from '../services/api';

export const SearchComponent = () => {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle localStorage after mount
  useEffect(() => {
    setMounted(true);
    const savedQuery = localStorage.getItem('lastSearch') || '';
    const savedResults = localStorage.getItem('lastResults');
    
    setQuery(savedQuery);
    if (savedResults) {
      setResults(JSON.parse(savedResults));
    }
    
    if (savedQuery) {
      handleSearch(savedQuery);
    }
  }, []);

  const handleSearch = async (searchQuery?: string) => {
    const queryToUse = searchQuery || query;
    if (!queryToUse.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await searchByArtist(queryToUse);
      
      if (response.response?.docs) {
        setResults(response.response.docs);
        if (mounted) {
          localStorage.setItem('lastSearch', queryToUse);
          localStorage.setItem('lastResults', JSON.stringify(response.response.docs));
        }
        
        if (response.response.docs.length === 0) {
          setError('Nenhum resultado encontrado');
        }
      } else {
        setError('Formato de resposta inválido');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.details || error.message || 'Erro ao buscar resultados';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Se não estiver montado, mostrar loading com o novo tema
  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-white">
            OpenStream Music
          </h1>
          <div className="max-w-2xl mx-auto">
            <div className="text-center text-zinc-400">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">
          OpenStream Music
        </h1>
        
        <div className="max-w-2xl mx-auto">
          <div className="relative mb-8">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for artists or albums..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-3 px-4 pl-12 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
            />
            <SearchIcon className="absolute left-4 top-3.5 text-zinc-400" size={20} />
          </div>
          
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center text-zinc-400">Searching...</div>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result) => (
                  <div
                    key={result.identifier}
                    className="bg-zinc-800 rounded-lg p-4 hover:bg-zinc-700 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/album/${result.identifier}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-16 h-16 bg-zinc-700 rounded-lg overflow-hidden">
                        <img
                          src={`https://archive.org/services/img/${result.identifier}`}
                          alt={result.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/album-placeholder.png';
                            (e.target as HTMLImageElement).parentElement?.classList.add('p-3');
                            e.currentTarget.parentElement?.appendChild(
                              <Music className="text-zinc-400" size={40} /> as unknown as Node
                            );
                          }}
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h3 className="font-semibold text-lg text-white truncate">
                          {result.title}
                        </h3>
                        <p className="text-zinc-400 truncate">
                          {result.creator || 'Unknown Artist'}
                          {result.year && ` • ${result.year}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : query ? (
              <div className="text-center text-zinc-400">No results found</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};