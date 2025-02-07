import request from 'supertest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { app } from '../../../backend/server';

const mock = new MockAdapter(axios);
const ARCHIVE_API_URL = 'https://archive.org/advancedsearch.php';

describe('Server API', () => {
  beforeEach(() => {
    mock.reset();
  });

  describe('Search Endpoint', () => {
    it('should return search results', async () => {
      const mockResponse = {
        response: {
          docs: [{ identifier: 'test1', title: 'Test Title', creator: 'Test Creator' }],
          numFound: 1,
          start: 0,
          rows: 10
        }
      };
      
      mock.onGet(new RegExp(ARCHIVE_API_URL)).reply(200, mockResponse);

      const response = await request(app)
        .get('/search')
        .query({ q: 'test artist' });

      expect(response.status).toBe(200);
      expect(response.body.response).toBeDefined();
      expect(response.body.response.docs).toBeDefined();
      expect(response.body.response.docs.length).toBe(1);
    });

    it('should handle missing query parameter', async () => {
      const response = await request(app).get('/search');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Query parameter is required');
    });

    it('should handle pagination parameters', async () => {
      const mockArchiveResponse = {
        response: {
          docs: Array(20).fill(null).map((_, i) => ({
            identifier: `test${i}`,
            title: `Test Title ${i}`,
            creator: 'Test Creator'
          })),
          numFound: 100,
          start: 10,
          rows: 10
        }
      };

      mock.onGet(new RegExp(ARCHIVE_API_URL)).reply(200, mockArchiveResponse);

      const response = await request(app)
        .get('/search')
        .query({ 
          q: 'test artist',
          start: 10,
          rows: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.response).toBeDefined();
      expect(response.body.response.start).toBe(10);
      expect(response.body.response.rows).toBe(10);
      expect(response.body.response.numFound).toBe(100);
      expect(response.body.response.docs).toHaveLength(20);
    });

    it('should return total count of results', async () => {
      const mockArchiveResponse = {
        response: {
          docs: Array(10).fill({
            identifier: 'test1',
            title: 'Test Title',
            creator: 'Test Creator'
          }),
          numFound: 100,
          start: 0,
          rows: 10
        }
      };

      mock.onGet(new RegExp(ARCHIVE_API_URL)).reply(200, mockArchiveResponse);

      const response = await request(app)
        .get('/search')
        .query({ q: 'test artist' });

      expect(response.status).toBe(200);
      expect(response.body.response).toBeDefined();
      expect(response.body.response.numFound).toBe(100);
    });
  });

  it('should return track details', async () => {
    const mockMetadata = {
      metadata: {
        identifier: 'test1',
        title: 'Test Title',
        creator: 'Test Creator'
      },
      files: [
        { 
          name: 'track1.mp3',
          format: 'MP3',
          title: 'Track 1',
          length: '300'
        }
      ]
    };

    mock.onGet(/metadata/).reply(200, mockMetadata);

    const response = await request(app).get('/track/test1');
    expect(response.status).toBe(200);
    expect(response.body.identifier).toBe('test1');
  });

  it('should handle invalid track identifier', async () => {
    mock.onGet(/metadata/).reply(404);

    const response = await request(app).get('/track/invalid');
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid identifier');
  });
});