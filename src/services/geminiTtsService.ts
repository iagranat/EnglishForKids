import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { soundService } from './soundService';
import { DEFAULT_API_KEY, DEFAULT_VOICE } from '../config/geminiConfig';

const STORAGE_KEY_API_KEY = '@english_kids_gemini_api_key';
const STORAGE_KEY_VOICE = '@english_kids_gemini_voice';

export type GeminiVoiceName = 'Puck' | 'Aoede' | 'Fenrir' | 'Kore';

class GeminiTtsService {
  private apiKey: string = DEFAULT_API_KEY;
  private voice: GeminiVoiceName = DEFAULT_VOICE; // Default configured voice
  private isGenerating: boolean = false;
  private memoryCache: Map<string, string> = new Map();
  private currentPlayer: AudioPlayer | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      const savedKey = await AsyncStorage.getItem(STORAGE_KEY_API_KEY);
      const savedVoice = await AsyncStorage.getItem(STORAGE_KEY_VOICE);
      
      this.apiKey = savedKey || DEFAULT_API_KEY;
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
    this.apiKey = key.trim();
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

  /**
   * Simple hash for caching filenames
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Stop any current audio player
   */
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

  /**
   * Play audio from local URI or Data URI
   */
  private async playAudioUri(uri: string, onDone?: () => void) {
    this.stopCurrentPlayback();
    await soundService.stop();

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
      const player = createAudioPlayer(uri);
      this.currentPlayer = player;
      player.play();
    } catch (err) {
      console.warn('Expo-audio playback error:', err);
      onDone?.();
    }
  }

  /**
   * Generate speech using Gemini 2.0 Flash Audio output
   */
  async generateSpeech(text: string, voiceOverride?: GeminiVoiceName): Promise<string | null> {
    if (!this.hasApiKey()) return null;

    const cacheKey = `${voiceOverride || this.voice}_${text.toLowerCase().trim()}`;
    const hash = this.hashString(cacheKey);

    // Check memory cache
    if (this.memoryCache.has(hash)) {
      return this.memoryCache.get(hash)!;
    }

    // Check disk cache on mobile
    if (Platform.OS !== 'web' && FileSystem.cacheDirectory) {
      const diskPath = `${FileSystem.cacheDirectory}gemini_tts_${hash}.wav`;
      const info = await FileSystem.getInfoAsync(diskPath);
      if (info.exists) {
        this.memoryCache.set(hash, diskPath);
        return diskPath;
      }
    }

    try {
      this.isGenerating = true;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;

      const prompt = `You are a cheerful, enthusiastic phonics and English teacher for young kids. Speak this exact phrase with clear, warm pronunciation: "${text}"`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceOverride || this.voice,
                },
              },
            },
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.warn('Gemini Audio API error:', errorData);
        this.isGenerating = false;
        return null;
      }

      const data = await response.json();
      const part = data.candidates?.[0]?.content?.parts?.[0];
      const inlineData = part?.inlineData;

      if (!inlineData?.data) {
        this.isGenerating = false;
        return null;
      }

      const base64Data = inlineData.data;
      const mimeType = inlineData.mimeType || 'audio/wav';

      if (Platform.OS === 'web') {
        const dataUri = `data:${mimeType};base64,${base64Data}`;
        this.memoryCache.set(hash, dataUri);
        this.isGenerating = false;
        return dataUri;
      }

      // Write to disk cache
      const diskPath = `${FileSystem.cacheDirectory}gemini_tts_${hash}.wav`;
      await FileSystem.writeAsStringAsync(diskPath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      this.memoryCache.set(hash, diskPath);
      this.isGenerating = false;
      return diskPath;
    } catch (err) {
      console.warn('Gemini TTS fetch error:', err);
      this.isGenerating = false;
      return null;
    }
  }

  /**
   * Speak with Gemini if available, otherwise seamlessly fallback to on-device TTS
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
      } catch {
        // Fallback below
      }
    }

    // Graceful fallback to on-device speech
    await soundService.speak(options?.fallbackText || text, {
      rate: 0.85,
      pitch: 1.05,
      onDone: options?.onDone,
    });
  }

  /**
   * Generate expressive, cheerful encouragement for games & milestones
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
