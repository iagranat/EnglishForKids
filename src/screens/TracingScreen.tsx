import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ALPHABET_DATA, LetterItem } from '../data/alphabetData';
import { soundService } from '../services/soundService';

interface Point {
  x: number;
  y: number;
  color: string;
}

interface TracingScreenProps {
  showHebrewHints: boolean;
  initialLetter?: LetterItem;
  onAddStars: (amount: number) => void;
}

const COLORS = ['#4361EE', '#F72585', '#10B981', '#FFBE0B', '#7209B7'];

export const TracingScreen: React.FC<TracingScreenProps> = ({
  showHebrewHints,
  initialLetter,
  onAddStars,
}) => {
  const [currentLetter, setCurrentLetter] = useState<LetterItem>(
    initialLetter || ALPHABET_DATA[0]
  );
  const [isUpper, setIsUpper] = useState(true);
  const [activeColor, setActiveColor] = useState(COLORS[0]);
  const [points, setPoints] = useState<Point[]>([]);

  const activeColorRef = useRef(activeColor);
  useEffect(() => {
    activeColorRef.current = activeColor;
  }, [activeColor]);

  // PanResponder to track touch points on canvas
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          const { locationX, locationY } = evt.nativeEvent;
          setPoints((prev) => [
            ...prev,
            { x: locationX, y: locationY, color: activeColorRef.current },
          ]);
        },
        onPanResponderMove: (evt: GestureResponderEvent) => {
          const { locationX, locationY } = evt.nativeEvent;
          setPoints((prev) => [
            ...prev,
            { x: locationX, y: locationY, color: activeColorRef.current },
          ]);
        },
      }),
    []
  );

  const handleClear = () => {
    setPoints([]);
  };

  const handleHear = () => {
    soundService.speakLetterName(currentLetter);
  };

  const handleFinishPractice = async () => {
    await soundService.playSuccessSound();
    await soundService.speak(`Excellent handwriting! You practiced the letter ${currentLetter.upper}!`);
    onAddStars(3);
    setPoints([]);
  };

  const handleSelectLetter = (item: LetterItem) => {
    setCurrentLetter(item);
    setPoints([]);
    soundService.speakLetterName(item);
  };

  const displayChar = isUpper ? currentLetter.upper : currentLetter.lower;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Horizontal Letter Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.letterPicker}
      >
        {ALPHABET_DATA.map((item) => {
          const isSelected = item.id === currentLetter.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.letterPickerItem,
                isSelected && styles.letterPickerItemSelected,
              ]}
              onPress={() => handleSelectLetter(item)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.letterPickerText,
                  isSelected && styles.letterPickerTextSelected,
                ]}
              >
                {item.upper}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Control bar: Capital/Small switch, Audio button, Clear button */}
      <View style={styles.controlBar}>
        <View style={styles.caseToggleGroup}>
          <TouchableOpacity
            style={[styles.caseBtn, isUpper && styles.caseBtnActive]}
            onPress={() => {
              setIsUpper(true);
              setPoints([]);
            }}
          >
            <Text style={[styles.caseBtnText, isUpper && styles.caseBtnTextActive]}>
              Capital {currentLetter.upper}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.caseBtn, !isUpper && styles.caseBtnActive]}
            onPress={() => {
              setIsUpper(false);
              setPoints([]);
            }}
          >
            <Text style={[styles.caseBtnText, !isUpper && styles.caseBtnTextActive]}>
              Small {currentLetter.lower}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.iconActionBtn} onPress={handleHear}>
            <Ionicons name="volume-medium" size={20} color="#4361EE" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconActionBtn} onPress={handleClear}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tracing Canvas Area */}
      <View style={styles.canvasContainer} {...panResponder.panHandlers}>
        {/* Background Guide Letter Outline */}
        <View style={styles.guideLetterContainer} pointerEvents="none">
          <Text style={styles.guideLetter}>{displayChar}</Text>
          <Text style={styles.ltrHint}>
            {showHebrewHints
              ? '➡️ כותבים משמאל לימין'
              : '➡️ Write from Left to Right'}
          </Text>
        </View>

        {/* User Drawn Dots / Strokes */}
        {points.map((pt, idx) => (
          <View
            key={idx}
            style={[
              styles.strokePoint,
              {
                left: pt.x - 7,
                top: pt.y - 7,
                backgroundColor: pt.color,
              },
            ]}
          />
        ))}
      </View>

      {/* Color Palette */}
      <View style={styles.paletteContainer}>
        <Text style={styles.paletteLabel}>
          {showHebrewHints ? 'צבע טוש:' : 'Marker Color:'}
        </Text>
        <View style={styles.paletteRow}>
          {COLORS.map((col) => {
            const isSelected = activeColor === col;
            return (
              <TouchableOpacity
                key={col}
                style={[
                  styles.colorDot,
                  { backgroundColor: col },
                  isSelected && styles.colorDotSelected,
                ]}
                onPress={() => setActiveColor(col)}
              />
            );
          })}
        </View>
      </View>

      {/* Done & Reward Button */}
      <TouchableOpacity
        style={styles.doneBtn}
        onPress={handleFinishPractice}
        activeOpacity={0.85}
      >
        <Ionicons name="checkmark-done-circle" size={24} color="#FFFFFF" />
        <Text style={styles.doneBtnText}>
          {showHebrewHints ? 'סיימתי לכתוב! 🌟 (+3 כוכבים)' : 'Done! 🌟 (+3 Stars)'}
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
  letterPicker: {
    paddingVertical: 8,
    gap: 8,
    marginBottom: 10,
  },
  letterPickerItem: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterPickerItemSelected: {
    backgroundColor: '#4361EE',
    borderColor: '#4361EE',
  },
  letterPickerText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
  },
  letterPickerTextSelected: {
    color: '#FFFFFF',
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  caseToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  caseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
  },
  caseBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  caseBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  caseBtnTextActive: {
    color: '#0F172A',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvasContainer: {
    height: 290,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guideLetterContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideLetter: {
    fontSize: 170,
    fontWeight: '900',
    color: '#E2E8F0',
    fontFamily: 'System',
    includeFontPadding: false,
    lineHeight: 180,
  },
  ltrHint: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: -10,
  },
  strokePoint: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  paletteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  paletteLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  doneBtn: {
    backgroundColor: '#10B981',
    borderRadius: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
