import { LetterItem } from '../data/alphabetData';
import { geminiTts } from './geminiTtsService';
import { nativeSpeech } from './nativeSpeechService';

class SoundService {
  async triggerHaptic(type: 'light' | 'medium' | 'success' | 'error' = 'light') {
    await nativeSpeech.triggerHaptic(type);
  }

  async stop() {
    geminiTts.stopCurrentPlayback();
    await nativeSpeech.stop();
  }

  /**
   * Speak general text (routes through Gemini AI voice with fallback to device speech)
   */
  async speak(text: string, options?: { rate?: number; pitch?: number; onDone?: () => void }) {
    await geminiTts.speak(text, {
      fallbackText: text,
      onDone: options?.onDone,
    });
  }

  /**
   * Speak Hebrew text
   */
  async speakHebrew(text: string) {
    await nativeSpeech.speakHebrew(text);
  }

  /**
   * Pronounce a single letter's name (uses active Gemini teacher voice)
   */
  async speakLetterName(letter: LetterItem) {
    await geminiTts.speakLetterName(letter);
  }

  /**
   * Pronounce a letter's phonics sound (uses active Gemini teacher voice)
   */
  async speakPhonicsSound(letter: LetterItem) {
    await geminiTts.speakPhonicsSound(letter);
  }

  /**
   * Pronounce example word & sentence (uses active Gemini teacher voice)
   */
  async speakWord(letter: LetterItem) {
    await geminiTts.speakWord(letter);
  }

  /**
   * Play celebration sound / chime
   */
  async playSuccessSound() {
    await nativeSpeech.playSuccessSound();
  }

  /**
   * Play error tone
   */
  async playErrorSound() {
    await nativeSpeech.playErrorSound();
  }
}

export const soundService = new SoundService();
