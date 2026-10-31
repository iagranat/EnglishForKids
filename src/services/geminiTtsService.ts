import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from 'expo-audio';
import { nativeSpeech } from './nativeSpeechService';
import { DEFAULT_API_KEY, DEFAULT_VOICE } from '../config/geminiConfig';
import { LetterItem } from '../data/alphabetData';

const STORAGE_KEY_API_KEY = '@english_kids_gemini_api_key';
const STORAGE_KEY_VOICE = '@english_kids_gemini_voice';

export type GeminiVoiceName = 'Puck' | 'Aoede' | 'Fenrir' | 'Kore';

/**
 * Wraps raw PCM 16-bit 24kHz mono audio with a 44-byte RIFF/WAVE header
 */
function pcmToWav(pcmBytes: Uint8Array, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const dataLen = pcmBytes.length;
  const fileLen = dataLen + 36;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  // RIFF
  view.setUint8(0, 0x52); view.setUint8(1, 0x49); view.setUint8(2, 0x46); view.setUint8(3, 0x46);
  view.setUint32(4, fileLen, true);
  // WAVE
  view.setUint8(8, 0x57); view.setUint8(9, 0x41); view.setUint8(10, 0x56); view.setUint8(11, 0x45);
  // fmt 
  view.setUint8(12, 0x66); view.setUint8(13, 0x6d); view.setUint8(14, 0x74); view.setUint8(15, 0x20);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  // data
  view.setUint8(36, 0x64); view.setUint8(37, 0x61); view.setUint8(38, 0x74); view.setUint8(39, 0x61);
  view.setUint32(40, dataLen, true);

  const wavBytes = new Uint8Array(44 + dataLen);
  wavBytes.set(new Uint8Array(header), 0);
  wavBytes.set(pcmBytes, 44);
  return wavBytes;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

class GeminiTtsService {
  private apiKey: string = DEFAULT_API_KEY;
  private voice: GeminiVoiceName = DEFAULT_VOICE;
  private memoryCache: Map<string, string> = new Map();
  private currentPlayer: AudioPlayer | null = null;
  private isGenerating = false;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      const savedKey = await AsyncStorage.getItem(STORAGE_KEY_API_KEY);
      const savedVoice = await AsyncStorage.getItem(STORAGE_KEY_VOICE);

      if (savedKey) {
        this.apiKey = savedKey.trim().replace(/\.+$/, '');
      } else {
        this.apiKey = DEFAULT_API_KEY.trim().replace(/\.+$/, '');
      }

      if (savedVoice) {
        this.voice = savedVoice as GeminiVoiceName;
      } else {
        this.voice = DEFAULT_VOICE;
      }
    } catch {
      // ignore
    }
  }

  getApiKey(): string {
    return this.apiKey;
  }

  async setApiKey(key: string) {
    this.apiKey = key.trim().replace(/\.+$/, '');
    await AsyncStorage.setItem(STORAGE_KEY_API_KEY, this.apiKey);
  }

  getVoice(): GeminiVoiceName {
    return this.voice;
  }

  async setVoice(voice: GeminiVoiceName) {
    this.voice = voice;
    await AsyncStorage.setItem(STORAGE_KEY_VOICE, voice);
  }

  hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 10);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  stopCurrentPlayback() {
    try {
      if (this.currentPlayer) {
        this.currentPlayer.pause();
        this.currentPlayer.remove();
        this.currentPlayer = null;
      }
    } catch {
      // ignore
    }
  }

  private async playAudioUri(uri: string, onDone?: () => void) {
    this.stopCurrentPlayback();
    await nativeSpeech.stop();

    if (Platform.OS === 'web') {
      try {
        const audio = new Audio(uri);
        audio.onended = () => onDone?.();
        await audio.play();
      } catch (err) {
        console.warn('Web audio playback error:', err);
        onDone?.();
      }
      return;
    }

    try {
      await setAudioModeAsync({ playsInSilentMode: true });
      const player = createAudioPlayer(uri);
      this.currentPlayer = player;
      player.play();

      // Estimate playback duration or listen to status
      setTimeout(() => {
        onDone?.();
      }, 3000);
    } catch (err) {
      console.warn('Expo-audio playback error:', err);
      onDone?.();
    }
  }

  /**
   * Request speech generation from Gemini 3.8 Flash TTS
   */
  async generateSpeech(text: string, voiceOverride?: GeminiVoiceName): Promise<string | null> {
    if (!this.hasApiKey()) return null;

    const cleanText = text.trim();
    const activeVoice = voiceOverride || this.voice;
    const cacheKey = `v2_${activeVoice}_${cleanText.toLowerCase()}`;
    const hash = this.hashString(cacheKey);

    // 1. Check in-memory cache
    if (this.memoryCache.has(hash)) {
      return this.memoryCache.get(hash)!;
    }

    // 2. Check disk cache on mobile
    if (Platform.OS !== 'web' && FileSystem.cacheDirectory) {
      const diskPath = `${FileSystem.cacheDirectory}gemini_v2_${hash}.wav`;
      const info = await FileSystem.getInfoAsync(diskPath);
      if (info.exists) {
        this.memoryCache.set(hash, diskPath);
        return diskPath;
      }
    }

    try {
      this.isGenerating = true;

      // Primary model: gemini-3.8-flash-tts, fallback: gemini-2.5-flash-preview-tts
      const models = ['gemini-3.8-flash-tts', 'gemini-2.5-flash-preview-tts'];
      let base64Audio: string | null = null;
      let returnedMime = 'audio/wav';

      for (const model of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: cleanText }] }],
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: activeVoice },
                  },
                },
              },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const inline = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
            if (inline?.data) {
              base64Audio = inline.data;
              returnedMime = inline.mimeType || 'audio/wav';
              break;
            }
          } else {
            const errText = await res.text();
            console.warn(`Gemini TTS (${model}) error:`, errText);
          }
        } catch (fetchErr) {
          console.warn(`Gemini TTS fetch error (${model}):`, fetchErr);
        }
      }

      if (!base64Audio) {
        this.isGenerating = false;
        return null;
      }

      // If audio is raw PCM, add standard WAV header
      let finalBase64 = base64Audio;
      if (returnedMime.includes('pcm') || returnedMime.includes('L16')) {
        const pcmBytes = base64ToUint8Array(base64Audio);
        const wavBytes = pcmToWav(pcmBytes, 24000);
        finalBase64 = uint8ArrayToBase64(wavBytes);
      }

      if (Platform.OS === 'web') {
        const dataUri = `data:audio/wav;base64,${finalBase64}`;
        this.memoryCache.set(hash, dataUri);
        this.isGenerating = false;
        return dataUri;
      }

      // Write to disk on mobile
      const diskPath = `${FileSystem.cacheDirectory}gemini_v2_${hash}.wav`;
      await FileSystem.writeAsStringAsync(diskPath, finalBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      this.memoryCache.set(hash, diskPath);
      this.isGenerating = false;
      return diskPath;
    } catch (err) {
      console.warn('Gemini generateSpeech unexpected error:', err);
      this.isGenerating = false;
      return null;
    }
  }

  /**
   * Speak using Gemini AI voice with automatic fallback to native speech
   */
  async speak(
    text: string,
    options?: {
      voice?: GeminiVoiceName;
      fallbackText?: string;
      onDone?: () => void;
    }
  ) {
    if (this.hasApiKey()) {
      try {
        const audioUri = await this.generateSpeech(text, options?.voice);
        if (audioUri) {
          await this.playAudioUri(audioUri, options?.onDone);
          return;
        }
      } catch (err) {
        console.warn('Gemini playback failed, falling back:', err);
      }
    }

    // Seamless fallback to on-device speech
    await nativeSpeech.speak(options?.fallbackText || text, {
      rate: 0.85,
      pitch: 1.05,
      onDone: options?.onDone,
    });
  }

  /**
   * Speak a letter's name (e.g. "The letter A")
   */
  async speakLetterName(letter: LetterItem) {
    await nativeSpeech.triggerHaptic('light');
    await this.speak(`The letter ${letter.upper}`, {
      fallbackText: letter.upper,
    });
  }

  /**
   * Speak a letter's phonics sound
   */
  async speakPhonicsSound(letter: LetterItem) {
    await nativeSpeech.triggerHaptic('light');
    const phrase = `The letter ${letter.upper} says ${letter.phonics}, like in ${letter.exampleWord}. ${letter.phonics}!`;
    await this.speak(phrase, { fallbackText: phrase });
  }

  /**
   * Speak the example word
   */
  async speakWord(letter: LetterItem) {
    await nativeSpeech.triggerHaptic('light');
    const phrase = `${letter.exampleWord}! ${letter.upper} is for ${letter.exampleWord}.`;
    await this.speak(phrase, { fallbackText: phrase });
  }

  /**
   * Speak dynamic celebratory praise
   */
  async speakEncouragement(context: 'match_win' | 'streak_3' | 'streak_5' | 'blend_success' | 'round_complete') {
    const ENCOURAGEMENTS: Record<typeof context, string[]> = {
      match_win: [
        'Brilliant match! You are super fast!',
        'Awesome job! Those two letters belong together!',
        'Spot on! Great memory!',
      ],
      streak_3: [
        'Three in a row! Your ears are incredible!',
        'Triple strike! You know your sounds so well!',
      ],
      streak_5: [
        'Five in a row! You are an absolute phonics superstar!',
        'Unstoppable! Five correct answers!',
      ],
      blend_success: [
        'Woohoo! You just blended those sounds into a real word!',
        'Fantastic reading! You put the sounds together perfectly!',
      ],
      round_complete: [
        'Hooray! Level completed! You earned bonus stars! Are you ready for the next challenge?',
        'Look at that! All matched! You are doing amazing!',
      ],
    };

    const choices = ENCOURAGEMENTS[context];
    const phrase = choices[Math.floor(Math.random() * choices.length)];
    await this.speak(phrase);
  }
}

export const geminiTts = new GeminiTtsService();
