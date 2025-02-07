export interface SearchParams {
  mediatype: string;
  format: string;
  collection?: string;
  creator?: string;
  title?: string;
  rows?: number;
  start?: number;
}

export interface SearchResult {
  id?: string;
  title?: string;
  artist?: string;
  tracks?: Track[];
  coverArt?: {
    small: string;
    medium: string;
    large: string;
  } | null;
  total: number;
  start: number;
  resultType?: 'releases' | 'recordings' | 'artists';
}

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
}

export interface Track {
  identifier: string;
  title: string;
  artist: string;
  streamUrl: string;
  coverArt?: string | null;
  musicBrainzId?: string;
  duration?: number;
  track?: number;
  format?: string;
  type?: string;    // Tipo do artista/grupo
  score?: number;   // Score de relevância da busca
}

export interface Album {
  identifier: string;
  title: string;
  creator: string;
  year?: string;
  coverUrl?: string;
  tracks: Track[];
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  coverUrl?: string;
  tracks: PlaylistTrack[];
  isSystem?: boolean;
  settings: PlaylistSettings;
}

export interface PlaylistTrack extends Track {
  addedAt: number;
  lastPlayedAt?: number;
  playCount: number;
  position: number;
}

export interface PlaylistSettings {
  repeat: 'none' | 'all' | 'one';
  shuffle: boolean;
  crossfade: boolean;
  crossfadeDuration: number;
}

export interface MusicBrainzArtist {
  id: string;
  name: string;
  type: string;
  score?: number;
}

export interface MusicBrainzRelease {
  id: string;
  title: string;
  date?: string;
  coverArt?: {
    small: string;
    large: string;
  };
}

export interface MusicBrainzResponse {
  artists: MusicBrainzArtist[];
  count: number;
  offset: number;
}