import axios from 'axios';
import { SearchParams, SearchResult } from '../types/interfaces';

const API_BASE_URL = 'http://localhost:3001/api';
const ARCHIVE_BASE_URL = 'https://archive.org/advancedsearch.php';

export const searchByArtist = async (query: string) => {
  console.log('Sending search request for:', query);
  try {
    // Remover espaços extras e fazer encode da query completa
    const formattedQuery = query.trim();
    const response = await axios.get(`${API_BASE_URL}/search/artist`, {
      params: { 
        query: formattedQuery
      },
      paramsSerializer: params => {
        return Object.entries(params)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&');
      }
    });
    console.log('Search response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Search error:', {
      message: error.message,
      response: error.response?.data
    });
    throw error;
  }
};

export const getTrackDetails = async (identifier: string) => {
  const response = await axios.get(`${API_BASE_URL}/track/${identifier}`);
  return response.data;
};

export const searchByAlbum = async (albumName: string) => {
  const params = {
    q: `mediatype:(audio) AND title:("${albumName}") AND format:(MP3)`,
    fl: ['identifier', 'title', 'creator', 'year'],
    output: 'json'
  };
  return await executeSearch(params);
};

export const getStreamUrl = (identifier: string) => {
  return `https://archive.org/download/${identifier}`;
};

const executeSearch = async (params: any) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${ARCHIVE_BASE_URL}?${queryString}`);
  return await response.json();
};