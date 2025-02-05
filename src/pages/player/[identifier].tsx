import React from 'react';
import { useRouter } from 'next/router';
import { Player } from '../../components/Player';

export default function PlayerPage() {
  const router = useRouter();
  const { identifier, track } = router.query;

  if (!identifier || typeof identifier !== 'string') {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <button 
        onClick={() => router.back()}
        className="mb-4 px-4 py-2 bg-gray-500 text-white rounded"
      >
        Voltar
      </button>
      <Player identifier={identifier} trackUrl={track as string} />
    </div>
  );
}
