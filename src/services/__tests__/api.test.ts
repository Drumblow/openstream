import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { searchArtist, getTrackDetails } from '../api';
import { cacheService } from '../cacheService';

const mock = new MockAdapter(axios);

jest.mock('../cacheService', () => ({
  cacheService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('API Service', () => {
  beforeEach(() => {
    mock.reset();
    mock.resetHistory();
    jest.clearAllMocks();
  });

  // Cleanup após todos os testes
  afterAll(() => {
    mock.restore();
    jest.restoreAllMocks();
  });

  describe('searchArtist', () => {
    it('should return search results', async () => {
      const mockResponse = {
        response: {
          docs: [{ identifier: 'test1', title: 'Test Title', creator: 'Test Creator' }]
        }
      };

      mock.onGet('/api/search/artist').reply(200, mockResponse);
      const result = await searchArtist('test artist');
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty query', async () => {
      await expect(searchArtist('')).rejects.toThrow('Search query cannot be empty');
    });

    it('should handle API errors', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      mock.onGet('/api/search/artist').networkError();
      await expect(searchArtist('test artist')).rejects.toThrow('Failed to perform search');
    });

    it('should handle pagination parameters', async () => {
      const mockResponse = {
        response: {
          docs: [{ identifier: 'test1', title: 'Test Title', creator: 'Test Creator' }],
          numFound: 100,
          start: 10,
          rows: 10
        }
      };

      let requestConfig: any;
      mock.onGet('/api/search/artist').reply((config) => {
        requestConfig = config;
        return [200, mockResponse];
      });

      await searchArtist('test artist', { start: 10, rows: 10 });
      
      const params = new URLSearchParams(requestConfig.params);
      expect(params.get('start')).toBe('10');
      expect(params.get('rows')).toBe('10');
    });

    it('should return total results count', async () => {
      const mockResponse = {
        response: {
          docs: [],
          numFound: 100,
          start: 0,
          rows: 10
        }
      };

      mock.onGet('/api/search/artist').reply(200, mockResponse);
      const result = await searchArtist('test artist');
      expect(result.response.numFound).toBe(100);
    });
  });

  describe('getTrackDetails', () => {
    it('should return track details', async () => {
      const identifier = 'test1';
      const mockResponse = {
        identifier,
        title: 'Test Title',
        creator: 'Test Creator',
        tracks: [{ identifier: 'track1', title: 'Track 1', duration: 300 }],
      };

      mock.onGet(`/api/track/${identifier}`).reply(200, mockResponse);
      const result = await getTrackDetails(identifier);
      expect(result).toEqual(mockResponse);
    });

    it('should handle missing identifier', async () => {
      await expect(getTrackDetails('')).rejects.toThrow('Track identifier is required');
    });

    it('should handle API errors', async () => {
      (cacheService.get as jest.Mock).mockResolvedValue(null);
      mock.onGet('/api/track/test1').networkError();
      await expect(getTrackDetails('test1')).rejects.toThrow('Failed to fetch track details');
    });
  });
});