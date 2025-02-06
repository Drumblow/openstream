import React, { useState } from 'react';
import { X } from 'lucide-react';
import { usePlaylists } from '../../hooks/usePlaylists';
import { toast } from '../../services/toastService';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { createPlaylist } = usePlaylists();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a playlist name',
        type: 'error'
      });
      return;
    }

    try {
      await createPlaylist(name.trim(), description.trim());
      toast({
        title: 'Success',
        description: `Playlist "${name}" created successfully`,
        type: 'success'
      });
      setName('');
      setDescription('');
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create playlist',
        type: 'error'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create New Playlist</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-700 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-700 px-3 py-2 rounded-lg"
              placeholder="My Awesome Playlist"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-700 px-3 py-2 rounded-lg"
              placeholder="A collection of my favorite tracks"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-700 rounded-lg hover:bg-zinc-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 rounded-lg hover:bg-emerald-600"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
