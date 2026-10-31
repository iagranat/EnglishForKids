import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { LetterItem } from '../data/alphabetData';

class SoundService {
  private isSpeaking = false;

  /**
   * Play haptic feedback safely
   */
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
      // Haptics not available on this platform/device
    }
  }

  /**
   * Stop any current speech
   */
  async stop() {
    try {
      await Speech.stop();
      this.isSpeaking = false;
    } catch {
      // ignore
    }
  }

  /**
   * Speak English text with kid-friendly pitch & pacing
   */
  async speak(text: string, options?: { rate?: number; pitch?: number; onDone?: () => void }) {
    try {
      await this.stop();
      this.isSpeaking = true;
      Speech.speak(text, {
        language: 'en-US',
        pitch: options?.pitch ?? 1.05,
        rate: options?.rate ?? 0.85,
        onDone: () => {
          this.isSpeaking = false;
          options?.onDone?.();
        },
        onError: () => {
          this.isSpeaking = false;
        },
      });
    } catch (e) {
      this.isSpeaking = false;
      console.warn('Speech error:', e);
    }
  }

  /**
   * Speak Hebrew text (e.g. translation or pronunciation hint)
   */
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

  /**
   * Pronounce a single letter's name (e.g. "A", "B", "C")
   */
  async speakLetterName(letter: LetterItem) {
    await this.triggerHaptic('light');
    // Pronouncing letter clearly:
    await this.speak(letter.upper, { rate: 0.75, pitch: 1.1 });
  }

  /**
   * Pronounce letter sound (phonics sound)
   */
  async speakPhonicsSound(letter: LetterItem) {
    await this.triggerHaptic('light');
    // Using clear phonics phrasing: e.g. "The letter B says /buh/ as in Bear" or just the sound
    const phonicsPhrase = `${letter.upper} says ${letter.phonics}, like in ${letter.exampleWord}`;
    await this.speak(phonicsPhrase, { rate: 0.85, pitch: 1.05 });
  }

  /**
   * Pronounce the example word
   */
  async speakWord(letter: LetterItem) {
    await this.triggerHaptic('light');
    await this.speak(`${letter.exampleWord}! ${letter.upper} is for ${letter.exampleWord}.`, {
      rate: 0.85,
      pitch: 1.05,
    });
  }

  /**
   * Play celebration sound / chime
   */
  async playSuccessSound() {
    await this.triggerHaptic('success');
    // On web, we can also play a cheerful chime via Web Audio API
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
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

  /**
   * Play incorrect / try again sound
   */
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

export const soundService = new SoundService();
