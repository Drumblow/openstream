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
  identifier: string;
  title: string;
  creator: string;
  date?: string;
  year?: string;
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
  creator: string;
  streamUrl: string;
  duration?: number;
  track?: number;
  format?: string;
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