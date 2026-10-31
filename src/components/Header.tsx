import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GeminiVoiceName, VoiceMode } from '../services/geminiTtsService';

interface HeaderProps {
  stars: number;
  showHebrewHints: boolean;
  onToggleHebrewHints: () => void;
  onOpenGeminiSettings: () => void;
  currentVoice: GeminiVoiceName;
  voiceMode?: VoiceMode;
}

const getVoiceEmoji = (voice: GeminiVoiceName): string => {
  switch (voice) {
    case 'Aoede':
      return '👩';
    case 'Puck':
      return '👦';
    case 'Kore':
      return '🌸';
    case 'Fenrir':
      return '🦁';
    default:
      return '👩';
  }
};

export const Header: React.FC<HeaderProps> = ({
  stars,
  showHebrewHints,
  onToggleHebrewHints,
  onOpenGeminiSettings,
  currentVoice,
  voiceMode = 'hybrid',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>ABC</Text>
        </View>
        <View>
          <Text style={styles.title}>English Explorer</Text>
          <Text style={styles.subtitle}>
            {showHebrewHints ? 'לימוד אנגלית לילדים' : 'Learn Letters & Phonics'}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        {/* Teacher Voice & Latency Mode Button */}
        <TouchableOpacity
          style={styles.geminiBtn}
          onPress={onOpenGeminiSettings}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 13 }}>
            {voiceMode === 'native' ? '⚡' : getVoiceEmoji(currentVoice)}
          </Text>
          <Text style={styles.geminiBtnText}>
            {voiceMode === 'native' ? 'Local' : currentVoice}
          </Text>
          {voiceMode === 'hybrid' && (
            <Text style={{ fontSize: 9 }}>🚀</Text>
          )}
        </TouchableOpacity>

        {/* Hebrew hints toggle */}
        <TouchableOpacity
          style={[styles.hintButton, showHebrewHints && styles.hintButtonActive]}
          onPress={onToggleHebrewHints}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showHebrewHints ? 'language' : 'language-outline'}
            size={16}
            color={showHebrewHints ? '#FFFFFF' : '#4A5568'}
          />
          <Text
            style={[
              styles.hintButtonText,
              showHebrewHints && styles.hintButtonTextActive,
            ]}
          >
            {showHebrewHints ? 'עברית' : 'Eng'}
          </Text>
        </TouchableOpacity>

        {/* Stars Counter */}
        <View style={styles.starBadge}>
          <Ionicons name="star" size={18} color="#FFD166" />
          <Text style={styles.starText}>{stars}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    backgroundColor: '#4361EE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  geminiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#D8B4FE',
  },
  geminiBtnActive: {
    backgroundColor: '#7209B7',
    borderColor: '#7209B7',
  },
  geminiBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7209B7',
  },
  geminiBtnTextActive: {
    color: '#FFFFFF',
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  hintButtonActive: {
    backgroundColor: '#4361EE',
    borderColor: '#4361EE',
  },
  hintButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  hintButtonTextActive: {
    color: '#FFFFFF',
  },
  starBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  starText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#B45309',
  },
});
