
import React from 'react';
import { PlaylistView as OriginalPlaylistView } from './PlaylistView';

interface PlaylistViewProps {
  playlistId: string;
  onBack: () => void;
}

const PlaylistView: React.FC<PlaylistViewProps> = ({ playlistId, onBack }) => {
  return <OriginalPlaylistView playlistId={playlistId} onBack={onBack} />;
};

export default PlaylistView;