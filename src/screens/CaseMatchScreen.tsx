import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ALPHABET_DATA, LetterItem } from '../data/alphabetData';
import { soundService } from '../services/soundService';
import { geminiTts } from '../services/geminiTtsService';

interface CaseMatchScreenProps {
  showHebrewHints: boolean;
  onAddStars: (amount: number) => void;
}

const getRoundData = (roundNum: number) => {
  const startIndex = ((roundNum - 1) * 5) % ALPHABET_DATA.length;
  let pool = ALPHABET_DATA.slice(startIndex, startIndex + 5);
  if (pool.length < 5) {
    pool = [...pool, ...ALPHABET_DATA.slice(0, 5 - pool.length)];
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return { pool, shuffled };
};

export const CaseMatchScreen: React.FC<CaseMatchScreenProps> = ({
  showHebrewHints,
  onAddStars,
}) => {
  const [round, setRound] = useState(1);
  const [selectedUpper, setSelectedUpper] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [roundData, setRoundData] = useState(() => getRoundData(1));
  const [roundCompleted, setRoundCompleted] = useState(false);
  const [wrongPair, setWrongPair] = useState<{ upper: string; lower: string } | null>(null);

  const currentPool = roundData.pool;
  const shuffledLower = roundData.shuffled;

  const startNewRound = (roundNum: number) => {
    setRound(roundNum);
    setRoundData(getRoundData(roundNum));
    setMatchedIds([]);
    setSelectedUpper(null);
    setRoundCompleted(false);
    setWrongPair(null);
  };

  const handleUpperPress = (letter: LetterItem) => {
    if (matchedIds.includes(letter.id)) return;
    soundService.speakLetterName(letter);
    setSelectedUpper(letter.id);
    setWrongPair(null);
  };

  const handleLowerPress = async (letter: LetterItem) => {
    if (matchedIds.includes(letter.id)) return;
    if (!selectedUpper) {
      // Speak the lower letter name if no upper selected yet
      await soundService.speakLetterName(letter);
      return;
    }

    if (selectedUpper === letter.id) {
      // MATCH!
      const newMatched = [...matchedIds, letter.id];
      setMatchedIds(newMatched);
      setSelectedUpper(null);
      setWrongPair(null);
      await soundService.playSuccessSound();
      onAddStars(2);

      // Check if round finished
      if (newMatched.length === currentPool.length) {
        setRoundCompleted(true);
        onAddStars(5);
        await geminiTts.speakEncouragement('round_complete');
      } else {
        await geminiTts.speakEncouragement('match_win');
      }
    } else {
      // Mismatch
      setWrongPair({ upper: selectedUpper, lower: letter.id });
      await soundService.playErrorSound();
      await soundService.speak('Not quite, try again!');
      setTimeout(() => {
        setWrongPair(null);
      }, 1000);
    }
  };

  const handleNextRound = () => {
    startNewRound(round + 1);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Instructions header */}
      <View style={styles.instructionsCard}>
        <View style={styles.instructionsHeader}>
          <Ionicons name="sparkles" size={20} color="#7209B7" />
          <Text style={styles.instructionsTitle}>
            {showHebrewHints
              ? 'התאמת אות גדולה (Capital) לאות קטנה (Small)'
              : 'Match Big (Capital) & Small Letters'}
          </Text>
        </View>
        <Text style={styles.instructionsBody}>
          {showHebrewHints
            ? 'באנגלית לכל אות יש צורה גדולה וקטנה. בחרו אות משמאל והתאימו לה את האות הקטנה מימין!'
            : 'Tap a Big letter on the left, then find its matching Small letter on the right!'}
        </Text>
        <View style={styles.roundBadge}>
          <Text style={styles.roundBadgeText}>Round {round}</Text>
          <Text style={styles.matchedProgressText}>
            Matched: {matchedIds.length} / {currentPool.length}
          </Text>
        </View>
      </View>

      {/* Matching Columns */}
      <View style={styles.columnsWrapper}>
        {/* Left Column: Uppercase */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>CAPITAL (גדולות)</Text>
          {currentPool.map((letter) => {
            const isMatched = matchedIds.includes(letter.id);
            const isSelected = selectedUpper === letter.id;
            const isWrong = wrongPair?.upper === letter.id;

            return (
              <TouchableOpacity
                key={`upper-${letter.id}`}
                style={[
                  styles.matchCard,
                  isSelected && styles.matchCardSelected,
                  isMatched && styles.matchCardMatched,
                  isWrong && styles.matchCardWrong,
                ]}
                onPress={() => handleUpperPress(letter)}
                disabled={isMatched}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.matchLetterUpper,
                    { color: isMatched ? '#10B981' : letter.color },
                    isSelected && styles.matchLetterSelected,
                  ]}
                >
                  {letter.upper}
                </Text>
                {isMatched && (
                  <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Center Link indicator */}
        <View style={styles.linkColumn}>
          <Ionicons name="arrow-forward-outline" size={20} color="#94A3B8" />
        </View>

        {/* Right Column: Lowercase (Shuffled) */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>SMALL (קטנות)</Text>
          {shuffledLower.map((letter) => {
            const isMatched = matchedIds.includes(letter.id);
            const isWrong = wrongPair?.lower === letter.id;

            return (
              <TouchableOpacity
                key={`lower-${letter.id}`}
                style={[
                  styles.matchCard,
                  isMatched && styles.matchCardMatched,
                  isWrong && styles.matchCardWrong,
                ]}
                onPress={() => handleLowerPress(letter)}
                disabled={isMatched}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.matchLetterLower,
                    { color: isMatched ? '#10B981' : '#334155' },
                  ]}
                >
                  {letter.lower}
                </Text>
                {isMatched && (
                  <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Round Celebration Card */}
      {roundCompleted && (
        <View style={styles.celebrationCard}>
          <Ionicons name="trophy" size={48} color="#FFD166" />
          <Text style={styles.celebrationTitle}>
            {showHebrewHints ? 'כל הכבוד! סיימתם את הסיבוב!' : 'Brilliant Work!'}
          </Text>
          <Text style={styles.celebrationSub}>
            {showHebrewHints
              ? 'הרווחתם 5 כוכבים בונוס 🌟 מוכנים לסיבוב הבא?'
              : 'You matched all letters and earned 5 bonus stars!'}
          </Text>
          <TouchableOpacity
            style={styles.nextRoundBtn}
            onPress={handleNextRound}
            activeOpacity={0.85}
          >
            <Text style={styles.nextRoundText}>Next Level (שלב הבא)</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
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
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  instructionsBody: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  roundBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  roundBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7209B7',
  },
  matchedProgressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  columnsWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  column: {
    flex: 1,
    gap: 10,
  },
  linkColumn: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  matchCardSelected: {
    borderColor: '#4361EE',
    backgroundColor: '#EEF2FF',
    transform: [{ scale: 1.03 }],
  },
  matchCardMatched: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
    opacity: 0.85,
  },
  matchCardWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  matchLetterUpper: {
    fontSize: 32,
    fontWeight: '900',
  },
  matchLetterLower: {
    fontSize: 30,
    fontWeight: '800',
  },
  matchLetterSelected: {
    color: '#4361EE',
  },
  celebrationCard: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD166',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  celebrationTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    marginTop: 8,
  },
  celebrationSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  nextRoundBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  nextRoundText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
