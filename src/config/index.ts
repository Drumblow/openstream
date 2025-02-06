
export const config = {
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  CACHE_TTL: {
    SEARCH: 3600, // 1 hora
    ALBUM: 86400, // 24 horas
    ARTIST: 43200, // 12 horas,
  }
};