import { useRouter } from 'next/router';
import { PlaylistView } from '../../components/Playlist/PlaylistView';
import { Layout } from '../../components/Layout';

export default function PlaylistPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!id || typeof id !== 'string') {
    return null;
  }

  return (
    <Layout>
      <PlaylistView 
        playlistId={id} 
        onBack={() => router.push('/')}
      />
    </Layout>
  );
}
