import { GeminiVoiceName } from '../services/geminiTtsService';

/**
 * Default Gemini TTS Configuration
 *
 * You can set your API key in any of the following ways:
 * 1. Inside `.env.local` as `EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...` (Recommended, kept secret from git)
 * 2. As a GitHub Repository Secret named `GEMINI_API_KEY` (automatically baked into the APK builds)
 * 3. Directly in the `DEFAULT_API_KEY` variable below
 */
export const DEFAULT_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

/**
 * Default Teacher Voice:
 * - 'Aoede': Warm & friendly female teacher (Great for young learners)
 * - 'Puck': Playful & cheerful voice
 * - 'Kore': Gentle & soft tone
 * - 'Fenrir': Energetic & confident
 */
export const DEFAULT_VOICE: GeminiVoiceName =
  (process.env.EXPO_PUBLIC_DEFAULT_VOICE as GeminiVoiceName) || 'Aoede';
