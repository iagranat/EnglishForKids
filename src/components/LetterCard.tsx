import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LetterItem } from '../data/alphabetData';
import { soundService } from '../services/soundService';

interface LetterCardProps {
  letter: LetterItem;
  showHebrewHints: boolean;
  onPress: () => void;
}

export const LetterCard: React.FC<LetterCardProps> = ({
  letter,
  showHebrewHints,
  onPress,
}) => {
  const handleQuickSound = async (e: { stopPropagation?: () => void }) => {
    e.stopPropagation?.();
    await soundService.speakLetterName(letter);
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: letter.color + '40' }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Top row: Vowel badge & sound button */}
      <View style={styles.topRow}>
        {letter.isVowel ? (
          <View style={[styles.vowelBadge, { backgroundColor: letter.color }]}>
            <Text style={styles.vowelText}>
              {showHebrewHints ? 'תנועה' : 'VOWEL'}
            </Text>
          </View>
        ) : (
          <View style={styles.placeholderBadge} />
        )}

        <TouchableOpacity
          style={[styles.speakerBtn, { backgroundColor: letter.badgeColor }]}
          onPress={handleQuickSound}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="volume-medium" size={16} color={letter.color} />
        </TouchableOpacity>
      </View>

      {/* Main Letter display: Uppercase & Lowercase */}
      <View style={styles.letterRow}>
        <Text style={[styles.upperLetter, { color: letter.color }]}>
          {letter.upper}
        </Text>
        <Text style={[styles.lowerLetter, { color: letter.color }]}>
          {letter.lower}
        </Text>
      </View>

      {/* Phonics phoneme */}
      <View style={styles.phonicsPill}>
        <Text style={styles.phonicsText}>{letter.phonemeDisplay}</Text>
        {showHebrewHints && (
          <Text style={styles.hebrewPhonicsHint}>
            {letter.hebrewSoundHint.split(' ')[0]}
          </Text>
        )}
      </View>

      {/* Example illustration & word */}
      <View style={styles.exampleContainer}>
        <Text style={styles.emoji}>{letter.emoji}</Text>
        <Text style={styles.exampleWord}>{letter.exampleWord}</Text>
        {showHebrewHints && (
          <Text style={styles.exampleHebrew}>{letter.exampleHebrew}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
    justifyContent: 'space-between',
    minHeight: 180,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  vowelBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  vowelText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  placeholderBadge: {
    width: 20,
    height: 12,
  },
  speakerBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 4,
  },
  upperLetter: {
    fontSize: 38,
    fontWeight: '900',
    fontFamily: 'System',
    includeFontPadding: false,
  },
  lowerLetter: {
    fontSize: 26,
    fontWeight: '700',
    opacity: 0.85,
    fontFamily: 'System',
    includeFontPadding: false,
  },
  phonicsPill: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  phonicsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  hebrewPhonicsHint: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  exampleContainer: {
    alignItems: 'center',
    marginTop: 6,
  },
  emoji: {
    fontSize: 28,
    marginBottom: 2,
  },
  exampleWord: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  exampleHebrew: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    textAlign: 'center',
  },
});
