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

const validateAudioFiles = (files: any[]) => {
  return files.some(file => 
    (file.format === 'VBR MP3' || file.format === 'MP3') && 
    file.length && 
    parseInt(file.length) > 0 && 
    !file.name.includes('/') && // Evita subdiretórios
    !file.name.startsWith('_') // Evita arquivos de sistema
  );
};

app.get('/api/search/artist', async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    console.log('Search request received for:', query);
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Invalid query parameter' });
    }

    const decodedQuery = decodeURIComponent(query).trim();
    
    console.log('Fetching from Internet Archive...');
    
    // Construir uma query mais abrangente
    const searchTerms = decodedQuery.split(/\s+/).filter(term => term.length > 1);
    const normalizedQuery = searchTerms.join(' ');
    
    // Query mais refinada
    const searchQuery = `(
      mediatype:(audio) AND (
        creator:"${normalizedQuery}"^4 OR 
        title:"${normalizedQuery}"^3 OR 
        (${searchTerms.map(term => `creator:"${term}"`).join(' AND ')})^2 OR
        (${searchTerms.map(term => `title:"${term}"`).join(' AND ')})
      )
    ) AND (
      format:(MP3) OR format:"VBR MP3"
    ) AND -collection:podcasts 
      AND -collection:librivox
      AND -collection:audio_religion
      AND -title:cover 
      AND -title:karaoke
      AND -title:remix
      AND -title:"sound effect"
      AND -title:instrumental
      AND avg_rating:[3 TO 5]
      AND num_reviews:[1 TO *]
      AND downloads:[100 TO *]`;

    console.log('Search query:', searchQuery);

    const response = await axios.get(ARCHIVE_API_URL, {
      params: {
        q: searchQuery,
        fl: ['identifier', 'title', 'creator', 'year', 'format', 'collection', 'downloads', 'avg_rating'],
        sort: ['downloads desc', 'avg_rating desc', 'year desc'],
        output: 'json',
        rows: '150' // Aumentamos para ter mais opções após filtragem
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

    // Adicionar logs detalhados
    console.log('\n=== Album Details ===');
    console.log('Identifier:', identifier);
    console.log('Archive.org URL:', `https://archive.org/details/${identifier}`);
    console.log('Metadata URL:', `https://archive.org/metadata/${identifier}`);
    console.log('===================\n');

    const response = await axios.get(`https://archive.org/metadata/${identifier}`);
    const metadata = response.data;

    // Adicionar mais informações de debug
    console.log('Album Metadata:', {
      title: metadata.metadata.title,
      creator: metadata.metadata.creator,
      year: metadata.metadata.year,
      totalFiles: metadata.files.length,
      audioFiles: metadata.files.filter((f: any) => 
        f.format === 'VBR MP3' || f.format === 'MP3'
      ).length
    });

    // Validar arquivos MP3
    const validFiles = metadata.files.filter((file: any) => 
      (file.format === 'VBR MP3' || file.format === 'MP3') &&
      file.length &&
      parseInt(file.length) > 0 &&
      !file.name.includes('/') &&
      !file.name.startsWith('_')
    );

    console.log('Valid audio files:', validFiles.length);
    
    if (validFiles.length === 0) {
      console.log('Warning: No valid audio files found in this album');
      return res.status(404).json({ error: 'No valid audio files found' });
    }

    // Log dos arquivos válidos
    console.log('\nValid tracks:');
    validFiles.forEach((file: any, index: number) => {
      console.log(`${index + 1}. ${file.name} (${file.format}, ${file.length}s)`);
    });

    // Processar os dados do álbum
    const album = {
      identifier: metadata.metadata.identifier,
      title: metadata.metadata.title,
      creator: metadata.metadata.creator,
      year: metadata.metadata.year,
      coverUrl: `https://archive.org/services/img/${identifier}`,
      tracks: validFiles
        .map((file: any) => ({
          identifier: `${identifier}/${file.name}`,
          title: file.title || file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
          creator: metadata.metadata.creator,
          streamUrl: `https://archive.org/download/${identifier}/${file.name}`,
          duration: parseFloat(file.length) || 0,
          track: file.track ? parseInt(file.track) : null,
          format: file.format,
          size: parseInt(file.size || '0'),
          bitrate: file.bitrate
        }))
        .sort((a: any, b: any) => {
          // Melhor ordenação de faixas
          if (a.track && b.track) return a.track - b.track;
          if (a.track) return -1;
          if (b.track) return 1;
          return a.title.localeCompare(b.title);
        })
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