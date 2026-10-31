import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

class NativeSpeechService {
  private isSpeaking = false;
  private currentSpeechCancel: (() => void) | null = null;

  async triggerHaptic(type: 'light' | 'medium' | 'success' | 'error' = 'light') {
    try {
      if (Platform.OS === 'web') return;
      if (type === 'light') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (type === 'medium') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (type === 'success') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === 'error') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      // ignore
    }
  }

  async stop() {
    try {
      if (this.currentSpeechCancel) {
        this.currentSpeechCancel();
        this.currentSpeechCancel = null;
      }
      await Speech.stop();
      this.isSpeaking = false;
    } catch {
      // ignore
    }
  }

  async speak(text: string, options?: { rate?: number; pitch?: number; onDone?: () => void }) {
    try {
      await this.stop();
      this.isSpeaking = true;

      let wasCancelled = false;
      this.currentSpeechCancel = () => {
        wasCancelled = true;
      };

      Speech.speak(text, {
        language: 'en-US',
        pitch: options?.pitch ?? 1.05,
        rate: options?.rate ?? 0.85,
        onDone: () => {
          this.isSpeaking = false;
          if (!wasCancelled) {
            this.currentSpeechCancel = null;
            options?.onDone?.();
          }
        },
        onStopped: () => {
          this.isSpeaking = false;
          wasCancelled = true;
          this.currentSpeechCancel = null;
        },
        onError: () => {
          this.isSpeaking = false;
          wasCancelled = true;
          this.currentSpeechCancel = null;
        },
      });
    } catch (e) {
      this.isSpeaking = false;
      console.warn('Native speech error:', e);
    }
  }

  async speakHebrew(text: string) {
    try {
      await this.stop();
      Speech.speak(text, {
        language: 'he-IL',
        pitch: 1.0,
        rate: 0.9,
      });
    } catch (e) {
      console.warn('Hebrew speech error:', e);
    }
  }

  async playSuccessSound() {
    await this.triggerHaptic('success');
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.15, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.25);
        });
      } catch {
        // ignore
      }
    }
  }

  async playErrorSound() {
    await this.triggerHaptic('error');
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(180, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } catch {
        // ignore
      }
    }
  }
}

export const nativeSpeech = new NativeSpeechService();
