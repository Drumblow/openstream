import express from 'express';
import cors from 'cors';
import axios, { AxiosError } from 'axios';

const app = express();
const port = process.env.PORT || 3001;
const MUSICBRAINZ_API_URL = 'https://musicbrainz.org/ws/2';
const COVER_ART_URL = 'https://coverartarchive.org';
const ARCHIVE_API_URL = 'https://archive.org';

// Headers necessários para MusicBrainz
const headers = {
  'User-Agent': 'OpenStream/1.0.0 (your@email.com)',
  'Accept': 'application/json'
};

// Adicionar função de log
const logRequestInfo = (endpoint: string, params: any) => {
  console.log('\n=== API Request ===');
  console.log('Endpoint:', endpoint);
  console.log('Params:', JSON.stringify(params, null, 2));
};

const logResponseInfo = (endpoint: string, data: any) => {
  console.log('\n=== API Response ===');
  console.log('Endpoint:', endpoint);
  console.log('Data:', JSON.stringify(data, null, 2));
};

// Adicionar função de deduplificação
function deduplicateReleases(releases: any[]) {
  // Criar um Map usando título como chave
  const uniqueReleases = new Map();

  releases.forEach(release => {
    const existingRelease = uniqueReleases.get(release.title);
    
    // Se o release já existe, manter apenas o mais recente
    if (existingRelease) {
      const existingDate = new Date(existingRelease.date || '0000');
      const newDate = new Date(release.date || '0000');
      
      if (newDate > existingDate) {
        uniqueReleases.set(release.title, release);
      }
    } else {
      uniqueReleases.set(release.title, release);
    }
  });

  // Converter de volta para array e ordenar por data
  return Array.from(uniqueReleases.values())
    .sort((a, b) => {
      const dateA = new Date(a.date || '0000');
      const dateB = new Date(b.date || '0000');
      return dateB.getTime() - dateA.getTime();
    });
}

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/search', async (req, res) => {
  try {
    const { q: query, start = '0', rows = '10', type = 'auto' } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Primeiro, tentar encontrar um artista exato
    const artistResponse = await axios.get(`${MUSICBRAINZ_API_URL}/artist`, {
      headers,
      params: {
        query: query,
        limit: 1, // Pegamos apenas o primeiro resultado mais relevante
        fmt: 'json'
      }
    });

    // Se encontrou um artista com score alto (> 90), buscar seus lançamentos diretamente
    if (artistResponse.data.artists.length > 0 && artistResponse.data.artists[0].score > 90) {
      const artist = artistResponse.data.artists[0];
      
      // Buscar os lançamentos do artista com mais detalhes
      const releasesResponse = await axios.get(`${MUSICBRAINZ_API_URL}/release`, {
        headers,
        params: {
          artist: artist.id,
          limit: 50, // Aumentar o limite de busca
          offset: start,
          fmt: 'json',
          inc: 'recordings+artist-credits+release-groups+url-rels',
          status: 'official' // Apenas releases oficiais
        }
      });

      // Processar os lançamentos com múltiplas fontes de capas
      const releases = await Promise.all(
        releasesResponse.data.releases.map(async (release: any) => {
          try {
            // Tentar múltiplas fontes de capas
            const coverPromises = [
              // Cover Art Archive
              axios.get(`${COVER_ART_URL}/release/${release.id}`, { headers })
                .then(res => res.data.images[0]?.thumbnails)
                .catch(() => null),
              // Release Group Cover Art
              release['release-group']?.id ? 
                axios.get(`${COVER_ART_URL}/release-group/${release['release-group'].id}`, { headers })
                  .then(res => res.data.images[0]?.thumbnails)
                  .catch(() => null) : 
                Promise.resolve(null),
              // Tentar capa do MusicBrainz diretamente
              axios.get(`${MUSICBRAINZ_API_URL}/release/${release.id}`, {
                headers,
                params: { inc: 'url-rels', fmt: 'json' }
              })
                .then(res => {
                  const artworkUrl = res.data.relations?.find((rel: any) => 
                    rel.type === 'artwork' || rel.type === 'cover art'
                  )?.url?.resource;
                  return artworkUrl ? { small: artworkUrl, medium: artworkUrl, large: artworkUrl } : null;
                })
                .catch(() => null)
            ];

            // Usar a primeira capa disponível
            const covers = await Promise.all(coverPromises);
            const coverArt = covers.find(cover => cover !== null) || null;

            return {
              id: release.id,
              title: release.title,
              date: release.date,
              coverArt,
              artist: artist.name,
              type: 'release',
              releaseType: release['release-group']?.type || 'Album',
              trackCount: release.media?.[0]?.track_count || 0
            };
          } catch (error) {
            console.error(`Error processing release ${release.id}:`, error);
            return {
              id: release.id,
              title: release.title,
              date: release.date,
              coverArt: null,
              artist: artist.name,
              type: 'release',
              releaseType: release['release-group']?.type || 'Album',
              trackCount: release.media?.[0]?.track_count || 0
            };
          }
        })
      );

      // Deduplificar e filtrar releases
      const deduplicatedReleases = deduplicateReleases(releases)
        .filter(release => 
          // Remover singles e outros tipos menos relevantes se houver muitos resultados
          releases.length > 10 ? 
            ['Album', 'Live'].includes(release.releaseType) : 
            true
        )
        .sort((a, b) => {
          // Priorizar álbuns com capa
          if (a.coverArt && !b.coverArt) return -1;
          if (!a.coverArt && b.coverArt) return 1;
          // Depois por data
          return new Date(b.date || '0000').getTime() - new Date(a.date || '0000').getTime();
        });

      return res.json({
        response: {
          docs: deduplicatedReleases,
          numFound: releasesResponse.data.count,
          start: parseInt(start.toString()),
          rows: parseInt(rows.toString()),
          type: 'releases',
          artist: artist.name
        }
      });
    }

    // Se não encontrou um artista exato, buscar por gravações (músicas)
    const recordingResponse = await axios.get(`${MUSICBRAINZ_API_URL}/recording`, {
      headers,
      params: {
        query: query,
        limit: rows,
        offset: start,
        fmt: 'json'
      }
    });

    const recordings = recordingResponse.data.recordings.map((recording: any) => ({
      id: recording.id,
      title: recording.title,
      artist: recording['artist-credit']?.[0]?.name || 'Unknown Artist',
      type: 'recording'
    }));

    return res.json({
      response: {
        docs: recordings,
        numFound: recordingResponse.data.count,
        start: parseInt(start.toString()),
        rows: parseInt(rows.toString()),
        type: 'recordings'
      }
    });

  } catch (error) {
    console.error('\n=== Error ===');
    if (axios.isAxiosError(error)) {
      console.error('Search error details:', error.response?.data || error.message);
    } else {
      console.error('Search error details:', error);
    }
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

app.get('/artist/:id/releases', async (req, res) => {
  try {
    const { id } = req.params;
    const { start = '0', rows = '10' } = req.query;

    logRequestInfo('MusicBrainz Releases', {
      artistId: id,
      start,
      rows,
      url: `${MUSICBRAINZ_API_URL}/release`
    });

    const response = await axios.get(`${MUSICBRAINZ_API_URL}/release`, {
      headers,
      params: {
        artist: id,
        limit: rows,
        offset: start,
        fmt: 'json',
        inc: 'recordings+artist-credits+release-groups'
      }
    });

    // Log da resposta do MusicBrainz
    logResponseInfo('MusicBrainz Releases Response', {
      count: response.data.count,
      releases: response.data.releases.map((r: any) => ({
        id: r.id,
        title: r.title,
        date: r.date
      }))
    });

    // Buscar capas de álbum e processar releases
    const releases = await Promise.all(
      response.data.releases.map(async (release: any) => {
        try {
          const coverArt = await axios.get(`${COVER_ART_URL}/release/${release.id}`, { headers });
          return {
            id: release.id,
            title: release.title,
            date: release.date,
            coverArt: coverArt.data.images[0]?.thumbnails || null,
            artist: release['artist-credit']?.[0]?.name || '',
            tracks: release.media?.[0]?.tracks || []
          };
        } catch {
          return {
            id: release.id,
            title: release.title,
            date: release.date,
            coverArt: null,
            artist: release['artist-credit']?.[0]?.name || '',
            tracks: release.media?.[0]?.tracks || []
          };
        }
      })
    );

    const result = {
      response: {
        docs: releases,
        numFound: response.data.count,
        start: parseInt(start.toString()),
        rows: parseInt(rows.toString())
      }
    };

    // Log do resultado final
    logResponseInfo('Final Releases Response', result);

    res.json(result);
  } catch (error) {
    console.error('\n=== Error ===');
    if (axios.isAxiosError(error)) {
      console.error('Releases error details:', error.response?.data || error.message);
    } else {
      console.error('Releases error:', error);
    }
    res.status(500).json({ error: 'Failed to fetch releases' });
  }
});

// Nova rota para obter detalhes de uma release específica
app.get('/release/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const response = await axios.get(`${MUSICBRAINZ_API_URL}/release/${id}`, {
      headers,
      params: {
        fmt: 'json',
        inc: 'recordings+artist-credits'
      }
    });

    // Tentar buscar a capa do álbum
    let coverArt;
    try {
      const coverResponse = await axios.get(`${COVER_ART_URL}/release/${id}`, { headers });
      coverArt = coverResponse.data.images[0]?.thumbnails;
    } catch {
      coverArt = null;
    }

    res.json({
      ...response.data,
      coverArt
    });
  } catch (error) {
    console.error('Release detail error:', error);
    res.status(500).json({ error: 'Failed to fetch release details' });
  }
});

app.get('/track/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar detalhes da release com as faixas
    const releaseResponse = await axios.get(`${MUSICBRAINZ_API_URL}/release/${id}`, {
      headers,
      params: {
        fmt: 'json',
        inc: 'recordings+artist-credits+media'  // Incluir media para obter as faixas
      }
    });

    // Buscar capa do álbum
    let coverArt;
    try {
      const coverResponse = await axios.get(`${COVER_ART_URL}/release/${id}`, { headers });
      coverArt = coverResponse.data.images[0]?.thumbnails;
    } catch {
      coverArt = null;
    }

    // Processar e formatar as faixas
    const tracks = releaseResponse.data.media?.[0]?.tracks?.map((track: any) => ({
      identifier: track.id,
      title: track.title || track.recording?.title,
      artist: track['artist-credit']?.[0]?.name || releaseResponse.data['artist-credit']?.[0]?.name,
      duration: track.length ? track.length / 1000 : null, // Converter para segundos
      track: track.position,
      streamUrl: `https://musicbrainz.org/recording/${track.recording?.id}`,
      coverArt: coverArt
    })) || [];

    // Montar o objeto de resposta
    const response = {
      identifier: releaseResponse.data.id,
      title: releaseResponse.data.title,
      creator: releaseResponse.data['artist-credit']?.[0]?.name || 'Unknown Artist',
      year: releaseResponse.data.date?.split('-')[0],
      coverUrl: coverArt?.large || coverArt?.medium || coverArt?.small,
      tracks: tracks,
      coverArt: coverArt
    };

    res.json(response);
  } catch (error) {
    console.error('Track detail error:', error);
    if (axios.isAxiosError(error)) {
      console.error('API Error details:', error.response?.data);
    }
    res.status(500).json({ 
      error: 'Failed to fetch track details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Server error:', error);
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error'
  });
});

export { app };

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}