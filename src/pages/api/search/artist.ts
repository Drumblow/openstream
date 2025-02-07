import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const ARCHIVE_API_URL = 'https://archive.org/advancedsearch.php'
const CACHE_TTL = 3600000 // 1 hora

// Cache em memória (considere usar Redis em produção)
const cache = new Map<string, { data: any; timestamp: number }>()

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/_\d+$/, '')
    .replace(/\b(disc |cd |vol\.|volume |parte |pt\.|remix|remaster)\s*\d*\b/gi, '')
    .trim()
    .replace(/\s+/g, ' ')
}

function isSameAlbum(title1: string, title2: string): boolean {
  const norm1 = normalizeTitle(title1)
  const norm2 = normalizeTitle(title2)
  return norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      query, 
      start = '0', 
      rows = '10' 
    } = req.query;

    const startNum = parseInt(start.toString(), 10);
    const rowsNum = parseInt(rows.toString(), 10);
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Invalid query parameter' })
    }

    const decodedQuery = decodeURIComponent(query).trim()
    const cacheKey = `artist:${decodedQuery}`
    
    // Check cache
    const cachedItem = cache.get(cacheKey)
    if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_TTL) {
      return res.json(cachedItem.data)
    }

    const searchTerms = decodedQuery.split(/\s+/).filter(term => term.length > 1)
    
    // Melhorar a query de busca
    const searchQuery = `(${searchTerms.map(term => `creator:"${term}"`).join(' AND ')}) OR ` +
                       `(${searchTerms.map(term => `title:"${term}"`).join(' AND ')}) OR ` +
                       `creator:"${decodedQuery}" OR title:"${decodedQuery}"`;

    // Primeiro, buscar o total de resultados disponíveis
    const countResponse = await axios.get(ARCHIVE_API_URL, {
      params: {
        q: searchQuery + ' AND mediatype:(audio) AND format:(MP3) AND -collection:podcasts',
        fl: ['identifier'],
        rows: 0,
        output: 'json'
      }
    });

    const totalResults = countResponse.data.response.numFound;

    // Depois, buscar os resultados da página atual
    const response = await axios.get(ARCHIVE_API_URL, {
      params: {
        q: searchQuery + ' AND mediatype:(audio) AND format:(MP3) AND -collection:podcasts',
        fl: ['identifier', 'title', 'creator', 'year', 'downloads', 'format'],
        sort: ['downloads desc', 'year desc'],
        output: 'json',
        rows: rowsNum,
        start: startNum
      }
    });

    // Processar e filtrar resultados
    if (response.data?.response?.docs) {
      const processedDocs = response.data.response.docs.map((doc: any) => {
        return {
          ...doc,
          score: calculateScore(doc, decodedQuery)
        };
      }).sort((a: any, b: any) => b.score - a.score);

      const resultData = {
        response: {
          docs: processedDocs,
          numFound: totalResults,
          start: startNum,
          rows: rowsNum
        }
      };

      // Cache results
      cache.set(cacheKey, {
        data: resultData,
        timestamp: Date.now()
      });

      res.json(resultData);
    } else {
      res.json({ response: { docs: [], numFound: 0, start: startNum, rows: rowsNum } });
    }
  } catch (error: any) {
    console.error('Search error:', error)
    res.status(500).json({ 
      error: 'Search failed',
      details: error.message 
    })
  }
}

function calculateScore(doc: any, query: string): number {
  const title = Array.isArray(doc.title) ? doc.title[0] : doc.title;
  const creator = Array.isArray(doc.creator) ? doc.creator[0] : doc.creator;
  const titleLower = title?.toLowerCase() || '';
  const creatorLower = creator?.toLowerCase() || '';
  const queryLower = query.toLowerCase();

  let score = 0;
  if (creatorLower.includes(queryLower)) score += 10;
  if (titleLower.includes(queryLower)) score += 5;
  if (doc.downloads) score += Math.log(doc.downloads);
  if (doc.year) score += 2;

  return score;
}