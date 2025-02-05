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