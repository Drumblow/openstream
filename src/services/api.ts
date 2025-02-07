import axios from 'axios';
import { SearchParams, SearchResult, Track } from '../types/interfaces';
import { cacheService } from './cacheService';
import { AppError } from '../utils/errors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface SearchOptions {
  start?: number;
  rows?: number;
}

// Unified search function that replaces both searchMusic and searchArtist
export const searchArtist = async (query: string, options: SearchOptions = {}) => {
  if (!query?.trim()) {
    throw new Error('Search query cannot be empty');
  }

  try {
    console.log('Searching for:', query, 'with options:', options);
    
    const response = await axios.get('/api/search', {
      params: {
        q: query.trim(),
        start: options.start || 0,
        rows: options.rows || 10
      }
    });

    console.log('Search response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Search error:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data?.error || 'Search failed');
    }
    throw new Error('Failed to search');
  }
};

export const getArtistReleases = async (artistId: string, options: SearchOptions = {}) => {
  try {
    const { start = 0, rows = 10 } = options;
    const response = await axios.get(`/api/artist/${artistId}/releases`, {
      params: { start, rows }
    });
    return response.data;
  } catch (error) {
    console.error('Releases error:', error);
    throw new Error('Failed to fetch artist releases');
  }
};

export const getTrackDetails = async (identifier: string) => {
  if (!identifier) {
    throw new Error('Track identifier is required');
  }

  const cacheKey = `album:${identifier}`;
  const cachedData = await cacheService.get('album', cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/track/${identifier}`);
    await cacheService.set('album', cacheKey, response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error('Failed to fetch track details');
    }
    throw error;
  }
};