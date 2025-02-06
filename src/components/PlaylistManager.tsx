import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical, Play, Edit2, Trash2, Copy } from 'lucide-react';
import { usePlaylists } from '../hooks/usePlaylists';
import { usePlayer } from '../hooks/usePlayer';
import { Playlist, Track } from '../types/interfaces';
import { formatDuration } from '../utils/format';
import { toast } from '../services/toastService';

export const PlaylistManager = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const { 
    playlists, 
    createPlaylist, 
    deletePlaylist, 
    duplicatePlaylist,
    renamePlaylist,
    setActivePlaylist 
  } = usePlaylists();
  const { setCurrentTrack } = usePlayer();

  const handleCreatePlaylist = async () => {
    try {
      if (!newPlaylistName.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a playlist name',
          type: 'error'
        });
        return;
      }

      const playlist = await createPlaylist(
        newPlaylistName.trim(),
        newPlaylistDescription.trim() || undefined
      );

      toast({
        title: 'Success',
        description: `Playlist "${newPlaylistName}" created successfully`,
        type: 'success'
      });

      setIsCreating(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to create playlist',
        type: 'error'
      });
    }
  };

  const handlePlay = (playlist: Playlist) => {
    if (playlist.tracks.length > 0) {
      setCurrentTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  const getTotalDuration = (tracks: Track[]) => {
    return tracks.reduce((total, track) => total + (track.duration || 0), 0);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Playlists</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 rounded-lg hover:bg-emerald-600"
        >
          <Plus size={20} />
          New Playlist
        </button>
      </div>

      {isCreating && (
        <div className="bg-zinc-800 p-4 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="My Awesome Playlist"
              className="w-full bg-zinc-700 px-3 py-2 rounded-lg"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description (optional)</label>
            <input
              type="text"
              value={newPlaylistDescription}
              onChange={(e) => setNewPlaylistDescription(e.target.value)}
              placeholder="A collection of my favorite tracks"
              className="w-full bg-zinc-700 px-3 py-2 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 bg-zinc-700 rounded-lg hover:bg-zinc-600"
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePlaylist}
              className="px-4 py-2 bg-emerald-500 rounded-lg hover:bg-emerald-600"
            >
              Create
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="bg-zinc-800 rounded-lg p-4 group relative"
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 hover:bg-zinc-700 rounded-full">
                <MoreVertical size={20} />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-zinc-700 rounded-lg shadow-lg py-1 hidden group-hover:block">
                <button
                  onClick={() => handlePlay(playlist)}
                  className="w-full px-4 py-2 text-left hover:bg-zinc-600 flex items-center gap-2"
                >
                  <Play size={16} />
                  Play
                </button>
                <button
                  onClick={() => setEditingId(playlist.id)}
                  className="w-full px-4 py-2 text-left hover:bg-zinc-600 flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  Rename
                </button>
                <button
                  onClick={() => duplicatePlaylist(playlist.id)}
                  className="w-full px-4 py-2 text-left hover:bg-zinc-600 flex items-center gap-2"
                >
                  <Copy size={16} />
                  Duplicate
                </button>
                <button
                  onClick={() => deletePlaylist(playlist.id)}
                  className="w-full px-4 py-2 text-left hover:bg-zinc-600 text-red-400 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>

            {editingId === playlist.id ? (
              <input
                type="text"
                defaultValue={playlist.name}
                className="bg-zinc-700 px-3 py-2 rounded-lg w-full"
                autoFocus
                onBlur={(e) => {
                  renamePlaylist(playlist.id, e.target.value);
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    renamePlaylist(playlist.id, e.currentTarget.value);
                    setEditingId(null);
                  }
                }}
              />
            ) : (
              <h3 className="font-bold text-lg mb-2">{playlist.name}</h3>
            )}

            <p className="text-zinc-400 text-sm mb-4">
              {playlist.tracks.length} tracks • {formatDuration(getTotalDuration(playlist.tracks))}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => handlePlay(playlist)}
                className="px-4 py-2 bg-emerald-500 rounded-lg hover:bg-emerald-600 flex items-center gap-2"
                disabled={playlist.tracks.length === 0}
              >
                <Play size={16} />
                Play
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
