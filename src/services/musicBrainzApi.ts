import axios from 'axios';

const MUSICBRAINZ_API_URL = 'https://musicbrainz.org/ws/2';
const COVER_ART_URL = 'https://coverartarchive.org';

// Importante adicionar User-Agent para evitar bloqueio
const headers = {
  'User-Agent': 'OpenStream/1.0.0 (your@email.com)'
};

export interface MusicBrainzSearchOptions {
  offset?: number;
  limit?: number;
}

export async function searchArtist(query: string, options: MusicBrainzSearchOptions = {}) {
  const { offset = 0, limit = 20 } = options;

  try {
    const response = await axios.get(`${MUSICBRAINZ_API_URL}/artist`, {
      headers,
      params: {
        query,
        fmt: 'json',
        offset,
        limit
      }
    });

    return {
      artists: response.data.artists,
      count: response.data.count,
      offset: response.data.offset
    };
  } catch (error) {
    console.error('MusicBrainz search error:', error);
    throw new Error('Failed to search artists');
  }
}

export async function getArtistReleases(artistId: string, options: MusicBrainzSearchOptions = {}) {
  const { offset = 0, limit = 20 } = options;

  try {
    const response = await axios.get(`${MUSICBRAINZ_API_URL}/release`, {
      headers,
      params: {
        artist: artistId,
        fmt: 'json',
        offset,
        limit,
        inc: 'recordings+artist-credits'
      }
    });

    // Tentar buscar as capas dos álbuns
    const releases = await Promise.all(
      response.data.releases.map(async (release: any) => {
        try {
          const coverArt = await axios.get(`${COVER_ART_URL}/release/${release.id}`, { headers });
          return { ...release, coverArt: coverArt.data.images[0]?.thumbnails };
        } catch {
          return release;
        }
      })
    );

    return {
      releases,
      count: response.data.count,
      offset: response.data.offset
    };
  } catch (error) {
    console.error('MusicBrainz releases error:', error);
    throw new Error('Failed to fetch artist releases');
  }
}

export async function getRecording(recordingId: string) {
  try {
    const response = await axios.get(`${MUSICBRAINZ_API_URL}/recording/${recordingId}`, {
      headers,
      params: {
        fmt: 'json',
        inc: 'artist-credits+releases'
      }
    });

    return response.data;
  } catch (error) {
    console.error('MusicBrainz recording error:', error);
    throw new Error('Failed to fetch recording details');
  }
}
