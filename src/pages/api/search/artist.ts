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
    const { query } = req.query
    
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
    const normalizedQuery = searchTerms.join(' ')
    
    const searchQuery = `mediatype:(audio) AND (
      title:"${normalizedQuery}" OR 
      creator:"${normalizedQuery}" OR 
      (${searchTerms.map(term => `title:"${term}"`).join(' AND ')}) OR
      (${searchTerms.map(term => `creator:"${term}"`).join(' AND ')})
    ) AND format:(MP3) AND -collection:podcasts AND -title:cover`

    const response = await axios.get(ARCHIVE_API_URL, {
      params: {
        q: searchQuery,
        fl: ['identifier', 'title', 'creator', 'year', 'format', 'collection'],
        sort: ['downloads desc', 'year desc'],
        output: 'json',
        rows: '100'
      }
    })

    // Process results with scoring
    if (response.data?.response?.docs) {
      const searchTermsLower = searchTerms.map(term => term.toLowerCase())
      const groupedByTitle = new Map<string, any[]>()
      
      response.data.response.docs.forEach((doc: any) => {
        const title = Array.isArray(doc.title) ? doc.title[0] : doc.title
        const creator = Array.isArray(doc.creator) ? doc.creator[0] : doc.creator
        const normalizedTitle = normalizeTitle(title)
        
        let score = 0
        const titleLower = title?.toLowerCase() || ''
        const creatorLower = creator?.toLowerCase() || ''

        if (titleLower.includes(decodedQuery.toLowerCase())) score += 10
        if (creatorLower.includes(decodedQuery.toLowerCase())) score += 10
        if (creator === 'Album') score -= 5

        searchTermsLower.forEach(term => {
          if (titleLower.includes(term)) score += 3
          if (creatorLower.includes(term)) score += 3
        })

        const scoredDoc = {
          ...doc,
          _score: score
        }

        const existing = Array.from(groupedByTitle.values()).flat()
        const similarGroup = existing.find(g => isSameAlbum(g.title, title))
        
        if (similarGroup) {
          const groupKey = normalizeTitle(similarGroup.title)
          const group = groupedByTitle.get(groupKey) || []
          group.push(scoredDoc)
          groupedByTitle.set(groupKey, group)
        } else {
          groupedByTitle.set(normalizedTitle, [scoredDoc])
        }
      })

      response.data.response.docs = Array.from(groupedByTitle.values())
        .map(group => group.reduce((best, current) => 
          current._score > best._score ? current : best
        ))
        .filter(doc => doc._score > 0)
        .sort((a, b) => b._score - a._score)
        .slice(0, 50)
    }

    // Cache results
    cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    })

    res.json(response.data)
  } catch (error: any) {
    console.error('Search error:', error)
    res.status(500).json({ 
      error: 'Search failed',
      details: error.message 
    })
  }
}