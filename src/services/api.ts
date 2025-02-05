// src/services/api.ts
import axios from 'axios';
import { SearchParams, SearchResult } from '../types/interfaces';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const ARCHIVE_BASE_URL = 'https://archive.org/advancedsearch.php';

export const searchByArtist = async (query: string) => {
  try {
    const formattedQuery = query.trim();
    const response = await axios.get(`${API_BASE_URL}/search/artist`, {
      params: { query: formattedQuery },
      paramsSerializer: {
        serialize: (params) => {
          return Object.entries(params)
            .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
            .join('&');
        }
      }
    });
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
  try {
    const response = await axios.get(`${API_BASE_URL}/track/${identifier}`);
    return response.data;
  } catch (error: any) {
    console.error('Track fetch error:', error);
    throw error;
  }
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

const executeSearch = async (params: SearchParams | any) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${ARCHIVE_BASE_URL}?${queryString}`);
    if (!response.ok) {
      throw new Error(`Archive.org API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Execute search error:', error);
    throw error;
  }
};