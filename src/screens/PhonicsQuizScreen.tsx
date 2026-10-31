import React, { useState, useEffect, useRef } from 'react';
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

interface PhonicsQuizScreenProps {
  showHebrewHints: boolean;
  onAddStars: (amount: number) => void;
}

interface QuizQuestion {
  targetLetter: LetterItem;
  options: LetterItem[];
  type: 'phonics' | 'word';
}

const createQuizQuestion = (): QuizQuestion => {
  const randomIndex = Math.floor(Math.random() * ALPHABET_DATA.length);
  const target = ALPHABET_DATA[randomIndex];
  const otherLetters = ALPHABET_DATA.filter((l) => l.id !== target.id);
  const shuffledOthers = [...otherLetters].sort(() => Math.random() - 0.5);
  const distractors = shuffledOthers.slice(0, 3);
  const options = [target, ...distractors].sort(() => Math.random() - 0.5);
  const questionType: 'phonics' | 'word' = Math.random() > 0.5 ? 'phonics' : 'word';
  return { targetLetter: target, options, type: questionType };
};

const playPromptAudio = async (target: LetterItem, type: 'phonics' | 'word') => {
  if (type === 'phonics') {
    await soundService.speak(
      `Listen carefully. Which letter makes the sound: ${target.phonics}? ... ${target.phonics}!`,
      { rate: 0.8, pitch: 1.05 }
    );
  } else {
    await soundService.speak(
      `Which letter starts the word: ${target.exampleWord}?`,
      { rate: 0.85, pitch: 1.05 }
    );
  }
};

export const PhonicsQuizScreen: React.FC<PhonicsQuizScreenProps> = ({
  showHebrewHints,
  onAddStars,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>(createQuizQuestion);
  const nextQuestionRef = useRef<QuizQuestion>(createQuizQuestion());
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);

  useEffect(() => {
    // 1. Play current question audio promptly
    const timer = setTimeout(() => {
      playPromptAudio(currentQuestion.targetLetter, currentQuestion.type);
    }, 400);

    // 2. Pre-cache current question's option letters (High Priority)
    const currentOptionSounds = currentQuestion.options.map((o) => o.upper);
    geminiTts.prefetchMany(currentOptionSounds, { priority: 'high' });

    // 3. Predictive background prefetch for the NEXT question!
    // While the child answers the current question, Gemini AI audio for next question
    // (both prompt sentence and options) is downloaded and cached silently in the background
    const nextQ = nextQuestionRef.current;
    if (nextQ) {
      const nextPrompt =
        nextQ.type === 'phonics'
          ? `Listen carefully. Which letter makes the sound: ${nextQ.targetLetter.phonics}? ... ${nextQ.targetLetter.phonics}!`
          : `Which letter starts the word: ${nextQ.targetLetter.exampleWord}?`;
      geminiTts.prefetch(nextPrompt, undefined, 'normal');
      nextQ.options.forEach((o) => geminiTts.prefetch(o.upper, undefined, 'normal'));
    }

    return () => clearTimeout(timer);
  }, [currentQuestion]);

  const generateQuestion = () => {
    geminiTts.stopCurrentPlayback();
    const nextQ = nextQuestionRef.current;
    setCurrentQuestion(nextQ);
    nextQuestionRef.current = createQuizQuestion();
    setSelectedOptionId(null);
    setIsAnswerCorrect(null);
    setIsAnswering(false);
  };

  const handlePlaySoundAgain = () => {
    if (!currentQuestion) return;
    playPromptAudio(currentQuestion.targetLetter, currentQuestion.type);
  };

  const handleSelectOption = async (option: LetterItem) => {
    if (!currentQuestion || isAnswering) return;
    setIsAnswering(true);
    setSelectedOptionId(option.id);

    const isCorrect = option.id === currentQuestion.targetLetter.id;
    setIsAnswerCorrect(isCorrect);

    if (isCorrect) {
      await soundService.playSuccessSound();
      const nextStreak = streak + 1;
      setScore((prev) => prev + 10);
      setStreak(nextStreak);
      onAddStars(2);

      let hasAdvanced = false;
      const advanceToNext = () => {
        if (!hasAdvanced) {
          hasAdvanced = true;
          // Give a comfortable 700ms pause AFTER speech finishes completely
          setTimeout(() => {
            generateQuestion();
          }, 700);
        }
      };

      // Safety fallback timer: in case event is delayed, advance after 8s
      const safetyTimer = setTimeout(() => {
        advanceToNext();
      }, 8000);

      const onSpeechDone = () => {
        clearTimeout(safetyTimer);
        advanceToNext();
      };

      if (nextStreak === 3) {
        await geminiTts.speakEncouragement('streak_3', onSpeechDone);
      } else if (nextStreak === 5) {
        await geminiTts.speakEncouragement('streak_5', onSpeechDone);
      } else {
        await geminiTts.speak(
          `Correct! The letter ${option.upper} makes the sound ${currentQuestion.targetLetter.phonics}, like in ${currentQuestion.targetLetter.exampleWord}!`,
          {
            onDone: onSpeechDone,
          }
        );
      }
    } else {
      await soundService.playErrorSound();
      setStreak(0);
      await soundService.speak(
        `That was ${option.upper}. Try again to find the letter that sounds like ${currentQuestion.targetLetter.phonics}!`,
        { rate: 0.85, pitch: 1.05 }
      );
      setIsAnswering(false);
    }
  };

  if (!currentQuestion) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Ionicons name="trophy" size={18} color="#4361EE" />
          <Text style={styles.statText}>Score: {score}</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={{ fontSize: 16 }}>🔥</Text>
          <Text style={[styles.statText, { color: '#E63946' }]}>
            Streak: {streak}
          </Text>
        </View>
      </View>

      {/* Main Question Card */}
      <View style={styles.questionCard}>
        <View style={styles.questionBadge}>
          <Text style={styles.questionBadgeText}>
            {currentQuestion.type === 'phonics'
              ? 'Phonics Sound Challenge'
              : 'Starting Letter Challenge'}
          </Text>
        </View>

        <Text style={styles.questionTitle}>
          {showHebrewHints
            ? currentQuestion.type === 'phonics'
              ? 'איזו אות משמיעה את הצליל הזה?'
              : `איזו אות פותחת את המילה ${currentQuestion.targetLetter.exampleWord}?`
            : currentQuestion.type === 'phonics'
            ? 'Which letter makes this sound?'
            : `Which letter starts the word "${currentQuestion.targetLetter.exampleWord}"?`}
        </Text>

        {/* Visual clue (Emoji or Soundwave) */}
        <View style={styles.clueBox}>
          {currentQuestion.type === 'word' ? (
            <Text style={styles.clueEmoji}>
              {currentQuestion.targetLetter.emoji}
            </Text>
          ) : (
            <Ionicons name="volume-high" size={54} color="#4361EE" />
          )}

          {currentQuestion.type === 'word' && (
            <Text style={styles.clueWord}>
              {currentQuestion.targetLetter.exampleWord}
            </Text>
          )}

          {showHebrewHints && (
            <Text style={styles.clueHebrew}>
              {currentQuestion.type === 'word'
                ? `פירוש: ${currentQuestion.targetLetter.exampleHebrew}`
                : `רמז צליל: ${currentQuestion.targetLetter.hebrewSoundHint}`}
            </Text>
          )}
        </View>

        {/* Play Sound Button */}
        <TouchableOpacity
          style={styles.replaySoundBtn}
          onPress={handlePlaySoundAgain}
          activeOpacity={0.8}
        >
          <Ionicons name="volume-medium" size={22} color="#FFFFFF" />
          <Text style={styles.replaySoundText}>
            {showHebrewHints ? '🔊 השמע צליל שוב' : '🔊 Listen Again'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4 Letter Options Grid */}
      <Text style={styles.optionsPrompt}>
        {showHebrewHints ? 'בחרו את האות הנכונה:' : 'Choose the correct letter:'}
      </Text>

      <View style={styles.optionsGrid}>
        {currentQuestion.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrect = isAnswerCorrect && isSelected;
          const isWrong = isAnswerCorrect === false && isSelected;

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                isSelected && styles.optionCardSelected,
                isCorrect && styles.optionCardCorrect,
                isWrong && styles.optionCardWrong,
              ]}
              onPress={() => handleSelectOption(option)}
              activeOpacity={0.85}
              disabled={Boolean(isAnswering && isCorrect)}
            >
              <Text
                style={[
                  styles.optionUpper,
                  { color: option.color },
                  isCorrect && { color: '#10B981' },
                  isWrong && { color: '#EF4444' },
                ]}
              >
                {option.upper}
              </Text>
              <Text
                style={[
                  styles.optionLower,
                  isCorrect && { color: '#10B981' },
                  isWrong && { color: '#EF4444' },
                ]}
              >
                {option.lower}
              </Text>

              {isCorrect && (
                <View style={styles.badgeIndicator}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                </View>
              )}
              {isWrong && (
                <View style={styles.badgeIndicator}>
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Skip / Next Button */}
      <TouchableOpacity
        style={styles.skipBtn}
        onPress={generateQuestion}
        activeOpacity={0.7}
      >
        <Text style={styles.skipBtnText}>
          {showHebrewHints ? 'שאלה הבאה ⏩' : 'Next Question ⏩'}
        </Text>
      </TouchableOpacity>
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
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
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
  questionBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 10,
  },
  questionBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4361EE',
  },
  questionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 14,
  },
  clueBox: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 16,
  },
  clueEmoji: {
    fontSize: 54,
    marginBottom: 6,
  },
  clueWord: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  clueHebrew: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  replaySoundBtn: {
    backgroundColor: '#4361EE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#4361EE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  replaySoundText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  optionsPrompt: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  optionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: '#4361EE',
    backgroundColor: '#EEF2FF',
  },
  optionCardCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  optionCardWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  optionUpper: {
    fontSize: 36,
    fontWeight: '900',
  },
  optionLower: {
    fontSize: 26,
    fontWeight: '700',
    color: '#64748B',
  },
  badgeIndicator: {
    position: 'absolute',
    top: 6,
    right: 8,
  },
  skipBtn: {
    marginTop: 20,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
});
