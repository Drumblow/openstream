import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { PlayerState, Track, Album } from '../types/interfaces';
import { getTrackDetails } from '../services/api';

interface PlayerProps {
  identifier: string;
  trackUrl?: string;
}

export const Player: React.FC<PlayerProps> = ({ identifier, trackUrl }) => {
  const [album, setAlbum] = useState<Album | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentTrack: null,
    isPlaying: false,
    volume: 1,
    progress: 0,
    duration: 0
  });
  
  const soundRef = useRef<Howl | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    loadAlbum();
    return () => {
      soundRef.current?.unload();
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [identifier]);

  const loadAlbum = async () => {
    try {
      const albumData = await getTrackDetails(identifier);
      setAlbum(albumData);
      
      if (trackUrl) {
        const track = albumData.tracks.find(t => t.streamUrl === trackUrl);
        if (track) playTrack(track);
      } else if (albumData.tracks.length > 0) {
        playTrack(albumData.tracks[0]);
      }
    } catch (error) {
      console.error('Error loading album:', error);
    }
  };

  const playTrack = (track: Track) => {
    if (soundRef.current) {
      soundRef.current.unload();
    }

    const sound = new Howl({
      src: [track.streamUrl],
      html5: true,
      volume: playerState.volume,
      onload: () => {
        setPlayerState(prev => ({
          ...prev,
          currentTrack: track,
          duration: sound.duration()
        }));
      },
      onplay: () => {
        setPlayerState(prev => ({ ...prev, isPlaying: true }));
        startProgressTracking();
      },
      onpause: () => {
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
      },
      onend: () => {
        playNextTrack();
      }
    });

    soundRef.current = sound;
    sound.play();
  };

  const startProgressTracking = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    progressInterval.current = setInterval(() => {
      if (soundRef.current) {
        setPlayerState(prev => ({
          ...prev,
          progress: soundRef.current?.seek() || 0
        }));
      }
    }, 1000);
  };

  const togglePlayPause = () => {
    if (soundRef.current) {
      if (playerState.isPlaying) {
        soundRef.current.pause();
      } else {
        soundRef.current.play();
      }
    }
  };

  const playNextTrack = () => {
    if (!album || !playerState.currentTrack) return;
    const currentIndex = album.tracks.findIndex(t => t.identifier === playerState.currentTrack?.identifier);
    const nextTrack = album.tracks[currentIndex + 1];
    if (nextTrack) {
      playTrack(nextTrack);
    }
  };

  const playPreviousTrack = () => {
    if (!album || !playerState.currentTrack) return;
    const currentIndex = album.tracks.findIndex(t => t.identifier === playerState.currentTrack?.identifier);
    const previousTrack = album.tracks[currentIndex - 1];
    if (previousTrack) {
      playTrack(previousTrack);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="player bg-white shadow-lg rounded-lg p-4">
      {playerState.currentTrack && (
        <div className="player-controls space-y-4">
          <div className="track-info">
            <h3 className="text-xl font-bold">{playerState.currentTrack.title}</h3>
            <p className="text-gray-600">{playerState.currentTrack.creator}</p>
          </div>
          
          <div className="progress-bar">
            <div className="flex justify-between text-sm text-gray-500">
              <span>{formatTime(playerState.progress)}</span>
              <span>{formatTime(playerState.duration)}</span>
            </div>
            <div className="h-1 bg-gray-200 rounded-full mt-1">
              <div 
                className="h-1 bg-green-500 rounded-full" 
                style={{ width: `${(playerState.progress / playerState.duration) * 100}%` }}
              />
            </div>
          </div>

          <div className="controls flex justify-center space-x-4">
            <button 
              onClick={playPreviousTrack}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              ⏮️
            </button>
            <button 
              onClick={togglePlayPause}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              {playerState.isPlaying ? '⏸️' : '▶️'}
            </button>
            <button 
              onClick={playNextTrack}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              ⏭️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};