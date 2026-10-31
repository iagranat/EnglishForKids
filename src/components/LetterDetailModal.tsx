import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LetterItem } from '../data/alphabetData';
import { soundService } from '../services/soundService';
import { geminiTts } from '../services/geminiTtsService';

interface LetterDetailModalProps {
  letter: LetterItem | null;
  visible: boolean;
  showHebrewHints: boolean;
  onClose: () => void;
  onGoToTrace?: (letter: LetterItem) => void;
}

export const LetterDetailModal: React.FC<LetterDetailModalProps> = ({
  letter,
  visible,
  showHebrewHints,
  onClose,
  onGoToTrace,
}) => {
  const [selectedCase, setSelectedCase] = useState<'upper' | 'lower'>('upper');

  // Pre-fetch letter audio in background when modal is viewed
  useEffect(() => {
    if (visible && letter) {
      geminiTts.prefetch(letter.upper);
      geminiTts.prefetch(
        `The letter ${letter.upper} says ${letter.phonics}, like in ${letter.exampleWord}. ${letter.phonics}!`
      );
      geminiTts.prefetch(
        `${letter.exampleWord}! ${letter.upper} is for ${letter.exampleWord}.`
      );
    }
  }, [visible, letter]);

  if (!letter) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContent}>
          {/* Header row */}
          <View style={styles.modalHeader}>
            <View style={styles.badgeRow}>
              {letter.isVowel && (
                <View
                  style={[
                    styles.vowelTag,
                    { backgroundColor: letter.color + '20' },
                  ]}
                >
                  <Text style={[styles.vowelTagText, { color: letter.color }]}>
                    🌟 Vowel (תנועה)
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={32} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Big Letter Presentation & Case Switcher */}
            <View
              style={[
                styles.heroContainer,
                { backgroundColor: letter.badgeColor },
              ]}
            >
              <Text style={[styles.bigLetterDisplay, { color: letter.color }]}>
                {selectedCase === 'upper' ? letter.upper : letter.lower}
              </Text>

              {/* Case Switcher Tabs */}
              <View style={styles.caseSwitcher}>
                <TouchableOpacity
                  style={[
                    styles.caseTab,
                    selectedCase === 'upper' && styles.caseTabActive,
                  ]}
                  onPress={() => setSelectedCase('upper')}
                >
                  <Text
                    style={[
                      styles.caseTabText,
                      selectedCase === 'upper' && styles.caseTabTextActive,
                    ]}
                  >
                    Capital: {letter.upper}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.caseTab,
                    selectedCase === 'lower' && styles.caseTabActive,
                  ]}
                  onPress={() => setSelectedCase('lower')}
                >
                  <Text
                    style={[
                      styles.caseTabText,
                      selectedCase === 'lower' && styles.caseTabTextActive,
                    ]}
                  >
                    Small: {letter.lower}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3 Main Audio Buttons */}
            <View style={styles.soundButtonsGrid}>
              {/* 1. Letter Name */}
              <TouchableOpacity
                style={[
                  styles.audioActionCard,
                  { borderColor: letter.color + '50' },
                ]}
                onPress={() => soundService.speakLetterName(letter)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.audioIconCircle,
                    { backgroundColor: letter.color },
                  ]}
                >
                  <Ionicons name="volume-high" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.audioActionInfo}>
                  <Text style={styles.audioActionTitle}>Letter Name</Text>
                  <Text style={styles.audioActionSub}>
                    Say &quot;{letter.upper}&quot;
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 2. Phonics Sound */}
              <TouchableOpacity
                style={[
                  styles.audioActionCard,
                  { borderColor: letter.color + '50' },
                ]}
                onPress={() => soundService.speakPhonicsSound(letter)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.audioIconCircle,
                    { backgroundColor: '#7209B7' },
                  ]}
                >
                  <Ionicons name="musical-notes" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.audioActionInfo}>
                  <Text style={styles.audioActionTitle}>Phonics Sound</Text>
                  <Text style={styles.audioActionSub}>
                    Sound: {letter.phonemeDisplay}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 3. Example Word */}
              <TouchableOpacity
                style={[
                  styles.audioActionCard,
                  { borderColor: letter.color + '50' },
                ]}
                onPress={() => soundService.speakWord(letter)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.audioIconCircle,
                    { backgroundColor: '#06D6A0' },
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>{letter.emoji}</Text>
                </View>
                <View style={styles.audioActionInfo}>
                  <Text style={styles.audioActionTitle}>Word in English</Text>
                  <Text style={styles.audioActionSub}>
                    {letter.exampleWord} ({letter.exampleHebrew})
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Hebrew Bridge Information Box */}
            <View style={styles.bridgeBox}>
              <View style={styles.bridgeHeader}>
                <Ionicons name="bulb-outline" size={20} color="#D97706" />
                <Text style={styles.bridgeTitle}>איך זה נשמע בעברית?</Text>
              </View>

              <View style={styles.bridgeRow}>
                <Text style={styles.bridgeLabel}>צליל מקביל בעברית:</Text>
                <Text style={styles.bridgeValue}>{letter.hebrewSoundHint}</Text>
              </View>

              <View style={styles.bridgeRow}>
                <Text style={styles.bridgeLabel}>דוגמה:</Text>
                <Text style={styles.bridgeValue}>
                  {letter.emoji} {letter.exampleWord} = {letter.exampleHebrew}
                </Text>
              </View>

              <View style={styles.tipCard}>
                <Text style={styles.tipText}>💡 {letter.hebrewTip}</Text>
              </View>
            </View>

            {/* Shortcut to Practice Tracing */}
            {onGoToTrace && (
              <TouchableOpacity
                style={[
                  styles.practiceTraceBtn,
                  { backgroundColor: letter.color },
                ]}
                onPress={() => {
                  onClose();
                  onGoToTrace(letter);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="pencil" size={20} color="#FFFFFF" />
                <Text style={styles.practiceTraceText}>
                  תרגל כתיבה של האות {letter.upper}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vowelTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  vowelTagText: {
    fontSize: 13,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 2,
  },
  heroContainer: {
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 16,
  },
  bigLetterDisplay: {
    fontSize: 100,
    fontWeight: '900',
    fontFamily: 'System',
    includeFontPadding: false,
    lineHeight: 110,
  },
  caseSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    padding: 4,
    gap: 4,
    marginTop: 8,
  },
  caseTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  caseTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  caseTabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  caseTabTextActive: {
    color: '#0F172A',
  },
  soundButtonsGrid: {
    gap: 10,
    marginBottom: 16,
  },
  audioActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  audioIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioActionInfo: {
    flex: 1,
  },
  audioActionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  audioActionSub: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  bridgeBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  bridgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  bridgeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
  },
  bridgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  bridgeLabel: {
    fontSize: 14,
    color: '#78350F',
    fontWeight: '600',
  },
  bridgeValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
  },
  tipCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
    fontWeight: '600',
  },
  practiceTraceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  practiceTraceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
