import { useEffect } from 'react';
import { Howler } from 'howler';

export const useAudioContext = () => {
  useEffect(() => {
    const initAudio = () => {
      try {
        if (Howler.ctx?.state === 'suspended') {
          Howler.ctx.resume();
        }
        document.removeEventListener('click', initAudio);
        document.removeEventListener('touchstart', initAudio);
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    };

    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
  }, []);
};
