import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { identifier } = req.query
    
    if (!identifier || typeof identifier !== 'string') {
      return res.status(400).json({ error: 'Invalid identifier' })
    }

    const response = await axios.get(`https://archive.org/metadata/${identifier}`)
    const metadata = response.data

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
    }

    res.json(album)
  } catch (error) {
    console.error('Track fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch track details' })
  }
}