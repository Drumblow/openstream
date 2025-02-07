import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const ARCHIVE_API_URL = 'https://archive.org/advancedsearch.php';
const mock = new MockAdapter(axios);

interface ArchiveDoc {
  identifier: string;
  title: string;
  creator: string;
  format?: string[];
  collection?: string[];
  downloads?: number;
  year?: string;
}

interface ArchiveResponse {
  response: {
    docs: ArchiveDoc[];
    numFound: number;
    start: number;
  }
}

interface SearchParams {
  q: string;
  fl?: string[];
  sort?: string[];
  rows?: number;
  start?: number;
  mediatype?: string;
}

async function searchArchive(params: SearchParams): Promise<ArchiveResponse> {
  const fields = params.fl || ['identifier', 'title', 'creator', 'date', 'description'];
  const sorting = params.sort || ['date desc'];
  
  try {
    const response = await axios.get(ARCHIVE_API_URL, {
      params: {
        q: `${params.q} ${params.mediatype ? `mediatype:${params.mediatype}` : ''}`,
        fl: fields,
        sort: sorting,
        rows: params.rows || 50,
        start: params.start || 0,
        output: 'json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Archive.org API error:', error);
    throw error;
  }
}

describe('Archive.org API Integration', () => {
  beforeEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  it('should search for audio content', async () => {
    const mockResponse = {
      response: {
        docs: [
          { identifier: 'test1', title: 'Test Title', creator: 'Test Creator' }
        ],
        numFound: 1
      }
    };

    mock.onGet(ARCHIVE_API_URL).reply(200, mockResponse);

    const result = await searchArchive({
      q: 'Legiao Urbana',
      mediatype: 'audio'
    });

    expect(result.response).toBeDefined();
    expect(result.response.docs.length).toBeGreaterThan(0);
    expect(result.response.docs[0]).toHaveProperty('identifier');
    expect(result.response.docs[0]).toHaveProperty('title');
  });

  it('should search for video content', async () => {
    const mockResponse = {
      response: {
        docs: [
          { identifier: 'test1', title: 'Test Video', creator: 'Test Creator' }
        ]
      }
    };

    mock.onGet(ARCHIVE_API_URL).reply(200, mockResponse);

    const result = await searchArchive({
      q: 'Legiao Urbana',
      mediatype: 'movies'
    });

    expect(result.response).toBeDefined();
    expect(result.response.docs[0]).toHaveProperty('identifier');
  });

  it('should handle pagination', async () => {
    const mockResponse = {
      response: {
        docs: Array(10).fill({ identifier: 'test', title: 'Test' }),
        numFound: 100,
        start: 0
      }
    };

    mock.onGet(ARCHIVE_API_URL).reply(200, mockResponse);

    const result = await searchArchive({
      q: 'Legiao Urbana',
      mediatype: 'audio',
      start: 0,
      rows: 10
    });

    expect(result.response.docs.length).toBeLessThanOrEqual(10);
  });

  it('should sort by downloads', async () => {
    const mockResponse = {
      response: {
        docs: Array(10).fill(null).map((_, i) => ({
          identifier: `test${i}`,
          title: `Test Title ${i}`,
          creator: 'Test Creator',
          downloads: 1000 - i
        })),
        numFound: 10,
        start: 0
      }
    };

    mock.onGet(ARCHIVE_API_URL).reply((config) => {
      expect(config.params.sort).toContain('downloads desc');
      return [200, mockResponse];
    });

    const result = await searchArchive({
      q: 'Legiao Urbana',
      mediatype: 'audio',
      sort: ['downloads desc']
    });

    expect(result.response.docs.length).toBeGreaterThan(0);
    // Verify that results are sorted by downloads
    const downloads = result.response.docs.map(doc => doc.downloads as number);
    expect(downloads).toEqual([...downloads].sort((a, b) => (b || 0) - (a || 0)));
  });

  it('should exclude podcasts and covers from results', async () => {
    const mockResponse = {
      response: {
        docs: Array(10).fill(null).map((_, i) => ({
          identifier: `test${i}`,
          title: `Test Title ${i}`,
          creator: 'Test Creator',
          collection: ['music']
        })),
        numFound: 10,
        start: 0
      }
    };

    mock.onGet(ARCHIVE_API_URL).reply((config) => {
      expect(config.params.q).toContain('-collection:podcasts');
      expect(config.params.q).toContain('-title:cover');
      return [200, mockResponse];
    });

    const result = await searchArchive({
      q: 'Legiao Urbana AND -collection:podcasts AND -title:cover',
      mediatype: 'audio'
    });

    const hasPodcasts = result.response.docs.some(
      (doc: ArchiveDoc) => doc.collection?.includes('podcasts')
    );
    expect(hasPodcasts).toBe(false);
  });

  // Helper function to analyze results
  it('should analyze search quality', async () => {
    const mockResponse: ArchiveResponse = {
      response: {
        docs: Array(10).fill(null).map((_, i) => ({
          identifier: `test${i}`,
          title: `Test Title ${i}`,
          creator: 'Test Creator',
          format: ['MP3'],
          year: '2023'
        })),
        numFound: 100,
        start: 0
      }
    };

    mock.onGet(ARCHIVE_API_URL).reply(200, mockResponse);

    const result = await searchArchive({
      q: 'Legiao Urbana',
      mediatype: 'audio',
      rows: 100
    });

    const analysis = {
      totalResults: result.response.numFound,
      hasAudio: result.response.docs.every((doc: ArchiveDoc) => doc.format?.includes('MP3')),
      uniqueTitles: new Set(result.response.docs.map((doc: ArchiveDoc) => doc.title)).size,
      creators: new Set(result.response.docs.map((doc: ArchiveDoc) => doc.creator)).size
    };

    expect(analysis.totalResults).toBeGreaterThan(0);
    expect(analysis.hasAudio).toBe(true);
    expect(analysis.uniqueTitles).toBeGreaterThan(0);
  });
});
