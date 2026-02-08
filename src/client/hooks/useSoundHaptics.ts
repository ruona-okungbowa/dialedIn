import { useCallback, useEffect, useRef, useState } from 'react';

type SoundType = 'dial-move' | 'dial-lock' | 'reveal' | 'success' | 'error';

const SOUND_ENABLED_KEY = 'dialedin-sound-enabled';
const HAPTICS_ENABLED_KEY = 'dialedin-haptics-enabled';

// Simple sound generation using Web Audio API
const createSound = (
  type: SoundType,
  audioContext: AudioContext,
): void => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  switch (type) {
    case 'dial-move':
      oscillator.frequency.value = 200;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
      break;
    case 'dial-lock':
      oscillator.frequency.value = 400;
      oscillator.type = 'square';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.15);
      break;
    case 'reveal':
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
      break;
    case 'success':
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
      break;
    case 'error':
      oscillator.frequency.value = 150;
      oscillator.type = 'sawtooth';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
      break;
  }
};

const triggerHaptic = (pattern: VibratePattern): void => {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  navigator.vibrate(pattern);
};

type VibratePattern = number | number[];

export const useSoundHaptics = () => {
  const [soundEnabled, setSoundEnabledState] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    return stored !== 'false';
  });

  const [hapticsEnabled, setHapticsEnabledState] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(HAPTICS_ENABLED_KEY);
    return stored !== 'false';
  });

  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (soundEnabled && typeof window !== 'undefined' && !audioContextRef.current) {
      // Initialize audio context on first user interaction
      const initAudio = () => {
        try {
          audioContextRef.current = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext)();
        } catch (e) {
          console.warn('AudioContext not supported', e);
        }
      };

      // Try to initialize immediately, but also listen for user interaction
      try {
        initAudio();
      } catch {
        document.addEventListener('click', initAudio, { once: true });
        document.addEventListener('touchstart', initAudio, { once: true });
      }
    }
  }, [soundEnabled]);

  const playSound = useCallback(
    (type: SoundType) => {
      if (!soundEnabled || !audioContextRef.current) return;

      try {
        // Resume audio context if suspended (browser autoplay policy)
        if (audioContextRef.current.state === 'suspended') {
          void audioContextRef.current.resume();
        }
        createSound(type, audioContextRef.current);
      } catch (e) {
        console.warn('Failed to play sound', e);
      }
    },
    [soundEnabled],
  );

  const triggerHapticFeedback = useCallback(
    (pattern: VibratePattern = 10) => {
      if (!hapticsEnabled) return;
      triggerHaptic(pattern);
    },
    [hapticsEnabled],
  );

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
  };

  const setHapticsEnabled = (enabled: boolean) => {
    setHapticsEnabledState(enabled);
    localStorage.setItem(HAPTICS_ENABLED_KEY, String(enabled));
  };

  return {
    soundEnabled,
    hapticsEnabled,
    setSoundEnabled,
    setHapticsEnabled,
    playSound,
    triggerHapticFeedback,
  };
};
