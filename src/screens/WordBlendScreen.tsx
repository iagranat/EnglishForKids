import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CVC_WORDS, SimpleWordItem, ALPHABET_DATA } from '../data/alphabetData';
import { soundService } from '../services/soundService';
import { geminiTts } from '../services/geminiTtsService';

interface WordBlendScreenProps {
  showHebrewHints: boolean;
  onAddStars: (amount: number) => void;
}

export const WordBlendScreen: React.FC<WordBlendScreenProps> = ({
  showHebrewHints,
  onAddStars,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [blended, setBlended] = useState(false);
  const currentWord: SimpleWordItem = CVC_WORDS[currentIndex];

  const getPhonicsSoundForChar = (char: string) => {
    const found = ALPHABET_DATA.find(
      (l) => l.upper === char.toUpperCase() || l.lower === char.toLowerCase()
    );
    return found ? found.phonics : char;
  };

  const handleTapLetter = async (char: string) => {
    // Speak the actual phonics sound of the letter
    const phonicsSound = getPhonicsSoundForChar(char);
    await soundService.speak(phonicsSound, { rate: 0.75, pitch: 1.1 });
  };

  const handleBlendWord = async () => {
    setBlended(true);
    await soundService.playSuccessSound();

    // Speak phonics sound of each letter then the full blended word
    const phonicsList = currentWord.letters.map((char) => getPhonicsSoundForChar(char));
    const phonicsSpaced = phonicsList.join(' ... ');

    await soundService.speak(
      `${phonicsSpaced} ... ${currentWord.word}! ${currentWord.word} means ${currentWord.hebrew}.`,
      {
        rate: 0.8,
        pitch: 1.05,
        onDone: () => {
          geminiTts.speakEncouragement('blend_success');
        },
      }
    );
    onAddStars(2);
  };

  const handleNext = () => {
    setBlended(false);
    setCurrentIndex((prev) => (prev + 1) % CVC_WORDS.length);
  };

  const handlePrev = () => {
    setBlended(false);
    setCurrentIndex((prev) => (prev - 1 + CVC_WORDS.length) % CVC_WORDS.length);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Educational Banner */}
      <View style={styles.banner}>
        <Ionicons name="sparkles" size={22} color="#4361EE" />
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>
            {showHebrewHints
              ? 'מחברים צלילים למילים! (Phonics Blending)'
              : 'Blend Sounds to Read Words!'}
          </Text>
          <Text style={styles.bannerSub}>
            {showHebrewHints
              ? 'לחצו על כל אות כדי לשמוע את הצליל שלה, ואז לחצו "חבר מילה" כדי לקרוא את כולה!'
              : 'Tap each letter to hear its sound, then tap "Blend Word" to read it!'}
          </Text>
        </View>
      </View>

      {/* Word Progress */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={handlePrev}
          disabled={currentIndex === 0}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={currentIndex === 0 ? '#CBD5E1' : '#334155'}
          />
        </TouchableOpacity>

        <Text style={styles.navProgress}>
          Word {currentIndex + 1} of {CVC_WORDS.length}
        </Text>

        <TouchableOpacity style={styles.navBtn} onPress={handleNext}>
          <Ionicons name="chevron-forward" size={22} color="#334155" />
        </TouchableOpacity>
      </View>

      {/* Main Reading Card */}
      <View style={styles.blendCard}>
        {/* Emoji illustration */}
        <Text style={styles.wordEmoji}>{currentWord.emoji}</Text>

        {/* Big Individual Letters */}
        <View style={styles.letterTilesRow}>
          {currentWord.letters.map((char, idx) => (
            <TouchableOpacity
              key={`${char}-${idx}`}
              style={styles.letterTile}
              onPress={() => handleTapLetter(char)}
              activeOpacity={0.7}
            >
              <Text style={styles.letterTileChar}>{char}</Text>
              <Ionicons
                name="volume-medium"
                size={16}
                color="#4361EE"
                style={{ marginTop: 4 }}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Phonics hint */}
        <Text style={styles.phonicsHintText}>{currentWord.hint}</Text>

        {/* Translation in Hebrew if blended or enabled */}
        {(blended || showHebrewHints) && (
          <View style={styles.translationBadge}>
            <Text style={styles.translationText}>
              {currentWord.word} = {currentWord.hebrew}
            </Text>
          </View>
        )}

        {/* Big Blend Button */}
        <TouchableOpacity
          style={styles.blendActionBtn}
          onPress={handleBlendWord}
          activeOpacity={0.85}
        >
          <Ionicons name="play" size={22} color="#FFFFFF" />
          <Text style={styles.blendActionText}>
            {showHebrewHints ? 'חבר והשמע את המילה 🔊' : 'Blend & Read Word 🔊'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Word List Picker Quick Bar */}
      <Text style={styles.wordListHeader}>
        {showHebrewHints ? 'בחרו מילה לתרגול:' : 'Choose a word to practice:'}
      </Text>
      <View style={styles.wordListGrid}>
        {CVC_WORDS.map((w, idx) => {
          const isSelected = idx === currentIndex;
          return (
            <TouchableOpacity
              key={w.id}
              style={[
                styles.wordChip,
                isSelected && styles.wordChipSelected,
              ]}
              onPress={() => {
                setCurrentIndex(idx);
                setBlended(false);
              }}
            >
              <Text style={styles.wordChipEmoji}>{w.emoji}</Text>
              <Text
                style={[
                  styles.wordChipText,
                  isSelected && styles.wordChipTextSelected,
                ]}
              >
                {w.word}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  banner: {
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 14,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#312E81',
    marginBottom: 3,
  },
  bannerSub: {
    fontSize: 12,
    color: '#4338CA',
    lineHeight: 17,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navProgress: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  blendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  wordEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  letterTilesRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  letterTile: {
    width: 72,
    height: 86,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#4361EE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4361EE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  letterTileChar: {
    fontSize: 38,
    fontWeight: '900',
    color: '#1E293B',
  },
  phonicsHintText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 12,
    letterSpacing: 1,
  },
  translationBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  translationText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
  },
  blendActionBtn: {
    backgroundColor: '#4361EE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 18,
    shadowColor: '#4361EE',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  blendActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  wordListHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  wordListGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  wordChipSelected: {
    backgroundColor: '#4361EE',
    borderColor: '#4361EE',
  },
  wordChipEmoji: {
    fontSize: 18,
  },
  wordChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  wordChipTextSelected: {
    color: '#FFFFFF',
  },
});
