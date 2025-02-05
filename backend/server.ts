import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';

// Add interface for Archive.org document
interface ArchiveDocument {
  identifier: string;
  title: string | string[];
  creator?: string | string[];
  year?: string;
  date?: string;
}

interface ProcessedDocument {
  identifier: string;
  title: string;
  creator?: string;
  year?: string;
  date: string;
}

interface ScoredDocument {
  identifier: string;
  title: string;
  creator?: string;
  year?: string;
  _score: number;
}

const app = express();
const port = process.env.PORT || 3001;
const ARCHIVE_API_URL = 'https://archive.org/advancedsearch.php';

// Cache em memória
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hora em millisegundos

const getFromCache = (key: string) => {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return item.data;
};

const setToCache = (key: string, data: any) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

app.use(cors());
app.use(express.json());

// Adicionar funções auxiliares para normalização
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    // Remove caracteres especiais e pontuação
    .replace(/[^\w\s-]/g, '')
    // Remove números de versão e datas entre parênteses
    .replace(/\s*\([^)]*\)/g, '')
    // Remove sufixos comuns de versões de arquivos
    .replace(/_\d+$/, '')
    // Remove strings específicas que indicam duplicatas
    .replace(/\b(disc |cd |vol\.|volume |parte |pt\.|remix|remaster)\s*\d*\b/gi, '')
    // Normaliza espaços
    .trim()
    .replace(/\s+/g, ' ');
}

function isSameAlbum(title1: string, title2: string): boolean {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);
  return norm1 === norm2 || 
         norm1.includes(norm2) || 
         norm2.includes(norm1);
}

app.get('/api/search/artist', async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    console.log('Search request received for:', query);
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Invalid query parameter' });
    }

    const decodedQuery = decodeURIComponent(query).trim();
    const cacheKey = `artist:${decodedQuery}`;
    const cachedResults = getFromCache(cacheKey);
    
    if (cachedResults) {
      console.log('Returning cached results for:', decodedQuery);
      return res.json(cachedResults);
    }

    console.log('Fetching from Internet Archive...');
    
    // Construir uma query mais abrangente
    const searchTerms = decodedQuery.split(/\s+/).filter(term => term.length > 1);
    const normalizedQuery = searchTerms.join(' ');
    
    // Query mais abrangente inspirada no exemplo bem-sucedido
    const searchQuery = `mediatype:(audio) AND (
      title:"${normalizedQuery}" OR 
      creator:"${normalizedQuery}" OR 
      (${searchTerms.map(term => `title:"${term}"`).join(' AND ')}) OR
      (${searchTerms.map(term => `creator:"${term}"`).join(' AND ')})
    ) AND format:(MP3) AND -collection:podcasts AND -title:cover`;

    console.log('Search query:', searchQuery);

    const response = await axios.get(ARCHIVE_API_URL, {
      params: {
        q: searchQuery,
        fl: ['identifier', 'title', 'creator', 'year', 'format', 'collection'],
        sort: ['downloads desc', 'year desc'],
        output: 'json',
        rows: '100'
      }
    });

    console.log('Archive.org response:', response.status);
    console.log('Results found:', response.data?.response?.numFound || 0);

    // Processamento dos resultados com ranking de relevância
    if (response.data?.response?.docs) {
      const searchTermsLower = searchTerms.map(term => term.toLowerCase());
      const processedDocs = new Map<string, ScoredDocument>();
      
      // Primeiro passo: calcular scores e agrupar por título normalizado
      const groupedByTitle = new Map<string, ScoredDocument[]>();
      
      response.data.response.docs
        .map((doc: ArchiveDocument) => {
          const title = Array.isArray(doc.title) ? doc.title[0] : doc.title;
          const creator = Array.isArray(doc.creator) ? doc.creator[0] : doc.creator;
          const normalizedTitle = normalizeTitle(title);
          
          let score = 0;
          const titleLower = title?.toLowerCase() || '';
          const creatorLower = creator?.toLowerCase() || '';

          // Cálculo de score melhorado
          if (titleLower.includes(decodedQuery.toLowerCase())) score += 10;
          if (creatorLower.includes(decodedQuery.toLowerCase())) score += 10;
          if (creator === 'Album') score -= 5; // Penalizar entradas genéricas

          searchTermsLower.forEach(term => {
            if (titleLower.includes(term)) score += 3;
            if (creatorLower.includes(term)) score += 3;
          });

          const scoredDoc: ScoredDocument = {
            identifier: doc.identifier,
            title,
            creator,
            year: doc.year,
            _score: score
          };

          // Agrupar documentos similares
          const existing = Array.from(groupedByTitle.values()).flat();
          const similarGroup = existing.find(g => isSameAlbum(g.title, title));
          
          if (similarGroup) {
            const groupKey = normalizeTitle(similarGroup.title);
            const group = groupedByTitle.get(groupKey) || [];
            group.push(scoredDoc);
            groupedByTitle.set(groupKey, group);
          } else {
            groupedByTitle.set(normalizedTitle, [scoredDoc]);
          }
        });

      // Segundo passo: selecionar o melhor resultado de cada grupo
      response.data.response.docs = Array.from(groupedByTitle.values())
        .map(group => group.reduce((best, current) => 
          current._score > best._score ? current : best
        ))
        .filter(doc => doc._score > 0)
        .sort((a, b) => b._score - a._score)
        .slice(0, 50);
    }

    setToCache(cacheKey, response.data);
    res.json(response.data);
  } catch (error: any) {
    console.error('Search error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Search failed',
      details: error.message 
    });
  }
});

app.get('/api/track/:identifier', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    const response = await axios.get(`https://archive.org/metadata/${identifier}`);
    const metadata = response.data;

    // Processar os dados do álbum
    const album = {
      identifier: metadata.metadata.identifier,
      title: metadata.metadata.title,
      creator: metadata.metadata.creator,
      year: metadata.metadata.year,
      coverUrl: `https://archive.org/services/img/${identifier}`,
      tracks: metadata.files
        .filter((file: any) => file.format === 'VBR MP3' || file.format === 'MP3')
        .map((file: any) => ({
          identifier: `${identifier}/${file.name}`,
          title: file.title || file.name.replace(/\.[^/.]+$/, ""),
          creator: metadata.metadata.creator,
          streamUrl: `https://archive.org/download/${identifier}/${file.name}`,
          duration: file.length,
          track: file.track,
          format: file.format
        }))
        .sort((a: any, b: any) => (a.track || 0) - (b.track || 0))
    };

    res.json(album);
  } catch (error) {
    console.error('Track fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch track details' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Test the API: http://localhost:${port}/api/search/artist?query=grateful%20dead`);
});