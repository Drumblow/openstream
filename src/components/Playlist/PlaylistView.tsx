import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { Play, Pause, MoreVertical, GripVertical, Clock, Music, Heart, Trash2 } from 'lucide-react';
import { usePlaylists } from '../../hooks/usePlaylists';
import { usePlayer } from '../../hooks/usePlayer';
import { formatDuration } from '../../utils/format';
import { PlaylistTrack } from '../../types/interfaces';
import Link from 'next/link';
import { TrackContextMenu } from '../TrackContextMenu';
import { toast } from '../../services/toastService';
import { useFavorites } from '../../hooks/useFavorites';

interface PlaylistViewProps {
  playlistId: string;
  onBack: () => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlistId, onBack }) => {
  const { playlists, reorderTracks, deletePlaylist, removeTrack } = usePlaylists();
  const { setCurrentTrack, currentTrack, isPlaying } = usePlayer();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    track: PlaylistTrack;
    position: { x: number; y: number };
  } | null>(null);
  const [sortKey, setSortKey] = useState<'position' | 'title' | 'creator' | 'duration'>('position');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const playlist = playlists.find(p => p.id === playlistId);
  
  if (!playlist) return <div>Playlist not found</div>;

  const sortedTracks = [...playlist.tracks].sort((a, b) => {
    if (sortKey === 'position') {
      return sortDirection === 'asc' ? a.position - b.position : b.position - a.position;
    }
    if (sortKey === 'duration') {
      return sortDirection === 'asc' 
        ? (a.duration || 0) - (b.duration || 0)
        : (b.duration || 0) - (a.duration || 0);
    }
    const aValue = a[sortKey]?.toString().toLowerCase() || '';
    const bValue = b[sortKey]?.toString().toLowerCase() || '';
    return sortDirection === 'asc' 
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const trackId = result.draggableId;
    const newPosition = result.destination.index;

    reorderTracks(playlistId, trackId, newPosition);
  };

  const handlePlayTrack = (track: PlaylistTrack) => {
    setCurrentTrack(track, playlist.tracks);
  };

  const handleSelectTrack = (trackId: string, isShiftKey: boolean) => {
    if (isShiftKey && selectedTracks.length > 0) {
      const lastSelected = selectedTracks[selectedTracks.length - 1];
      const lastIndex = playlist.tracks.findIndex(t => t.identifier === lastSelected);
      const currentIndex = playlist.tracks.findIndex(t => t.identifier === trackId);
      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);
      const newSelection = playlist.tracks
        .slice(start, end + 1)
        .map(t => t.identifier);
      setSelectedTracks([...new Set([...selectedTracks, ...newSelection])]);
    } else {
      setSelectedTracks(prev => 
        prev.includes(trackId) 
          ? prev.filter(id => id !== trackId)
          : [...prev, trackId]
      );
    }
  };

  const handleSort = (key: typeof sortKey) => {
    if (key === sortKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, track: PlaylistTrack) => {
    e.preventDefault();
    const position = {
      x: Math.min(e.clientX, window.innerWidth - 200),
      y: Math.min(e.clientY, window.innerHeight - 200)
    };
    setContextMenu({ track, position });
  };

  const handleRemove = (track: PlaylistTrack) => {
    removeTrack(playlistId, track.identifier);
    toast({
      title: 'Success',
      description: 'Track removed from playlist',
      type: 'success'
    });
  };

  return (
    <div className="p-6">
      <button 
        onClick={onBack}
        className="mb-6 text-zinc-400 hover:text-white"
      >
        ← Back
      </button>

      <div className="flex items-end gap-6 mb-8">
        <div className="w-48 h-48 bg-zinc-800 rounded-lg shadow-lg flex items-center justify-center">
          {playlist.coverUrl ? (
            <img 
              src={playlist.coverUrl} 
              alt={playlist.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Music size={64} className="text-zinc-600" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="text-sm text-zinc-400 mb-1">Playlist</div>
          <h1 className="text-4xl font-bold mb-2">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-zinc-400 mb-4">{playlist.description}</p>
          )}
          <div className="text-sm text-zinc-400">
            {playlist.tracks.length} tracks • 
            {formatDuration(playlist.tracks.reduce((acc, track) => acc + (track.duration || 0), 0))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-4 text-sm text-zinc-400 px-2">
          <div className="w-8">#</div>
          <button 
            className="flex-1 flex items-center gap-1 hover:text-white"
            onClick={() => handleSort('title')}
          >
            Title
            {sortKey === 'title' && (
              <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <button 
            className="w-48 hover:text-white"
            onClick={() => handleSort('creator')}
          >
            Artist
            {sortKey === 'creator' && (
              <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <button 
            className="w-20 text-right hover:text-white"
            onClick={() => handleSort('duration')}
          >
            Duration
            {sortKey === 'duration' && (
              <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={playlistId}>
            {(provided: DroppableProvided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-1 mt-2"
              >
                {sortedTracks.map((track, index) => (
                  <Draggable 
                    key={track.identifier} 
                    draggableId={track.identifier} 
                    index={index}
                  >
                    {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onContextMenu={(e) => handleContextMenu(e, track)}
                        className={`
                          flex items-center gap-4 p-2 rounded-lg group
                          ${snapshot.isDragging ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}
                          ${currentTrack?.identifier === track.identifier ? 'bg-zinc-800' : ''}
                          ${selectedTracks.includes(track.identifier) ? 'bg-zinc-700' : ''}
                        `}
                        onClick={(e) => handleSelectTrack(track.identifier, e.shiftKey)}
                      >
                        <div className="w-8 text-center text-zinc-400">
                          {index + 1}
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayTrack(track);
                          }}
                          className="w-8 h-8 flex items-center justify-center"
                        >
                          {currentTrack?.identifier === track.identifier && isPlaying ? (
                            <div className="w-4 h-4 relative flex items-center justify-center">
                              <div className="w-1 h-4 bg-emerald-500 animate-music-bar-1" />
                              <div className="w-1 h-4 bg-emerald-500 animate-music-bar-2 mx-[2px]" />
                              <div className="w-1 h-4 bg-emerald-500 animate-music-bar-3" />
                            </div>
                          ) : (
                            <Play size={20} className="opacity-0 group-hover:opacity-100" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className={`font-medium truncate ${
                            currentTrack?.identifier === track.identifier ? 'text-emerald-500' : ''
                          }`}>
                            {track.title}
                          </div>
                          <div className="text-sm text-zinc-400 truncate">
                            {track.creator}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => {
                              if (isFavorite(track.identifier)) {
                                removeFavorite(track.identifier);
                              } else {
                                addFavorite(track);
                              }
                            }}
                            className="p-2 hover:bg-zinc-700 rounded-full"
                          >
                            <Heart
                              size={16}
                              className={isFavorite(track.identifier) ? 'fill-emerald-500 text-emerald-500' : 'text-zinc-400 hover:text-emerald-500'}
                            />
                          </button>

                          <button
                            onClick={() => handleRemove(track)}
                            className="p-2 hover:bg-zinc-700 rounded-full"
                          >
                            <Trash2
                              size={16}
                              className="text-zinc-400 hover:text-red-500"
                            />
                          </button>

                          <span className="text-sm text-zinc-400 w-16 text-right">
                            {formatDuration(track.duration || 0)}
                          </span>
                          <button className="opacity-0 group-hover:opacity-100">
                            <MoreVertical size={20} />
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {contextMenu && (
        <TrackContextMenu
          track={contextMenu.track}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onPlay={() => {
            handlePlayTrack(contextMenu.track);
            setContextMenu(null);
          }}
        />
      )}
    </div>
  );
};
