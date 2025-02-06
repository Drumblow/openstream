import { Howl, Howler } from 'howler';

class AudioManager {
  private static instance: AudioManager;
  private isInitialized = false;

  private constructor() {
    // Configure Howler
    Howler.autoUnlock = false;
    Howler.html5PoolSize = 10;
    Howler.autoSuspend = false;
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      try {
        await this.setupAudioContext();
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    }
  }

  private async setupAudioContext(): Promise<void> {
    if (!Howler.ctx) return;

    const unlock = () => {
      if (Howler.ctx?.state === 'suspended') {
        Howler.ctx.resume();
      }
      ['click', 'touchstart', 'keydown'].forEach(event => {
        document.removeEventListener(event, unlock);
      });
    };

    ['click', 'touchstart', 'keydown'].forEach(event => {
      document.addEventListener(event, unlock, { once: true });
    });
  }

  public createSound(options: any): Howl {
    if (!this.isInitialized) {
      this.initialize();
    }
    return new Howl({
      ...options,
      html5: true,
      preload: true,
      pool: 5
    });
  }
}

export const audioManager = AudioManager.getInstance();
