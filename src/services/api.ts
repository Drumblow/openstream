// src/services/api.ts
import axios, { AxiosError } from 'axios';
import { SearchParams, SearchResult } from '../types/interfaces';
import { cacheService } from './cacheService';
import { AppError } from '../utils/errors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const ARCHIVE_BASE_URL = 'https://archive.org/advancedsearch.php';

export const searchByArtist = async (query: string) => {
  try {
    if (!query?.trim()) {
      throw AppError.badRequest('Search query cannot be empty');
    }

    const cacheKey = `artist:${query}`;
    const cachedData = await cacheService.get('search', cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

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
    }).catch((error: AxiosError) => {
      if (error.response?.status === 404) {
        throw AppError.notFound('No results found');
      }
      if (error.response?.status === 503) {
        throw AppError.serviceUnavailable('Search service is temporarily unavailable');
      }
      throw error;
    });

    // Validate response
    if (!response.data?.response?.docs) {
      throw AppError.serviceUnavailable('Invalid response from search service');
    }

    await cacheService.set('search', cacheKey, response.data);
    return response.data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (axios.isAxiosError(error)) {
      console.error('Search error:', {
        message: error.message,
        response: error.response?.data
      });
      throw AppError.serviceUnavailable('Failed to perform search', {
        status: error.response?.status,
        data: error.response?.data
      });
    }
    // Handle unknown errors
    console.error('Unexpected error:', error);
    throw AppError.serviceUnavailable('An unexpected error occurred');
  }
};

export const getTrackDetails = async (identifier: string) => {
  try {
    if (!identifier) {
      throw AppError.badRequest('Track identifier is required');
    }

    const cacheKey = `album:${identifier}`;
    const cachedData = await cacheService.get('album', cacheKey);
    
    if (cachedData) {
      return cachedData;
    }

    const response = await axios.get(`${API_BASE_URL}/track/${identifier}`)
      .catch((error: AxiosError) => {
        if (error.response?.status === 404) {
          throw AppError.notFound('Album not found');
        }
        throw error;
      });

    await cacheService.set('album', cacheKey, response.data);
    return response.data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (axios.isAxiosError(error)) {
      console.error('Track fetch error:', {
        message: error.message,
        response: error.response?.data
      });
      throw AppError.serviceUnavailable('Failed to fetch track details', {
        status: error.response?.status,
        data: error.response?.data
      });
    }
    // Handle unknown errors
    console.error('Unexpected error:', error);
    throw AppError.serviceUnavailable('An unexpected error occurred');
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