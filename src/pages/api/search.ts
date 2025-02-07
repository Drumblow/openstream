import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q, start, rows } = req.query;
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
    
    console.log('Backend URL:', BACKEND_URL);
    console.log('Search params:', { q, start, rows });

    const response = await axios.get(`${BACKEND_URL}/search`, {
      params: { q, start, rows }
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('Search API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Search failed',
      details: error.response?.data || error.message
    });
  }
}