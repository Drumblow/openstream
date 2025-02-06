import React from 'react';

export const DebugPanel: React.FC = () => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 p-2 bg-zinc-800 rounded-lg">
      Debug Mode
    </div>
  );
};
