import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { ALPHABET_DATA, LetterItem } from '../data/alphabetData';
import { LetterCard } from '../components/LetterCard';
import { LetterDetailModal } from '../components/LetterDetailModal';
import { geminiTts } from '../services/geminiTtsService';

interface LettersScreenProps {
  showHebrewHints: boolean;
  onGoToTrace: (letter: LetterItem) => void;
}

type FilterType = 'all' | 'vowels' | 'consonants';

export const LettersScreen: React.FC<LettersScreenProps> = ({
  showHebrewHints,
  onGoToTrace,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedLetter, setSelectedLetter] = useState<LetterItem | null>(null);

  // Pre-cache sounds for initial visible alphabet cards on page load (A-H)
  useEffect(() => {
    const initialLetters = ALPHABET_DATA.slice(0, 8);
    const sounds: string[] = [];
    initialLetters.forEach((l) => {
      sounds.push(l.upper);
      sounds.push(l.phonics);
    });
    geminiTts.prefetchMany(sounds, { priority: 'normal' });
  }, []);

  const filteredLetters = ALPHABET_DATA.filter((letter) => {
    if (activeFilter === 'vowels') return letter.isVowel;
    if (activeFilter === 'consonants') return !letter.isVowel;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Intro banner for Hebrew speakers */}
      <View style={styles.banner}>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>
            {showHebrewHints
              ? 'באנגלית יש 26 אותיות! לכל אות צורה גדולה וקטנה'
              : 'English Alphabet: Capital & Small Letters'}
          </Text>
          <Text style={styles.bannerSubtitle}>
            {showHebrewHints
              ? 'לחצו על כל אות כדי לשמוע את השם, הצליל והמילה שלה'
              : 'Tap any card to hear its name, phonics sound & example'}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            activeFilter === 'all' && styles.filterChipActive,
          ]}
          onPress={() => setActiveFilter('all')}
        >
          <Text
            style={[
              styles.filterChipText,
              activeFilter === 'all' && styles.filterChipTextActive,
            ]}
          >
            All (26)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            activeFilter === 'vowels' && styles.filterChipActive,
          ]}
          onPress={() => setActiveFilter('vowels')}
        >
          <Text
            style={[
              styles.filterChipText,
              activeFilter === 'vowels' && styles.filterChipTextActive,
            ]}
          >
            🌟 Vowels / תנועות (5)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            activeFilter === 'consonants' && styles.filterChipActive,
          ]}
          onPress={() => setActiveFilter('consonants')}
        >
          <Text
            style={[
              styles.filterChipText,
              activeFilter === 'consonants' && styles.filterChipTextActive,
            ]}
          >
            Consonants / עיצורים (21)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Letter Grid */}
      <FlatList
        data={filteredLetters}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <LetterCard
              letter={item}
              showHebrewHints={showHebrewHints}
              onPress={() => setSelectedLetter(item)}
            />
          </View>
        )}
      />

      {/* Detail Modal */}
      <LetterDetailModal
        letter={selectedLetter}
        visible={!!selectedLetter}
        showHebrewHints={showHebrewHints}
        onClose={() => setSelectedLetter(null)}
        onGoToTrace={onGoToTrace}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  banner: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  bannerTextContainer: {
    gap: 3,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterChipActive: {
    backgroundColor: '#4361EE',
    borderColor: '#4361EE',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardWrapper: {
    width: '48.5%',
  },
});
