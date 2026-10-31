import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ALPHABET_DATA, LetterItem } from '../data/alphabetData';
import { soundService } from '../services/soundService';
import { geminiTts } from '../services/geminiTtsService';

interface Point {
  x: number;
  y: number;
  color: string;
}

interface TracingEvaluation {
  status: 'empty' | 'incomplete' | 'good' | 'excellent';
  starsAwarded: number;
  scorePercent: number;
  isLeftToRight: boolean;
  titleEn: string;
  titleHe: string;
  messageEn: string;
  messageHe: string;
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
  const [evaluationResult, setEvaluationResult] = useState<TracingEvaluation | null>(null);

  const currentLetterIdx = ALPHABET_DATA.findIndex((l) => l.id === currentLetter.id);
  const nextLetter = ALPHABET_DATA[(currentLetterIdx + 1) % ALPHABET_DATA.length];

  const activeColorRef = useRef(activeColor);
  useEffect(() => {
    activeColorRef.current = activeColor;
  }, [activeColor]);

  const canvasRef = useRef<React.ElementRef<typeof View>>(null);
  const canvasLayoutRef = useRef<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const updateCanvasLayout = () => {
    canvasRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      if (width > 0 && height > 0) {
        canvasLayoutRef.current = { x, y, width, height };
      }
    });
  };

  // Pre-cache sounds for active letter + upcoming letter in the alphabet
  useEffect(() => {
    // 1. Current letter sounds (High priority)
    const currentSounds = [
      currentLetter.upper,
      `Sensational handwriting! You traced the letter ${currentLetter.upper} beautifully! You earned three stars!`,
      `Good job! You're learning how to write the letter ${currentLetter.upper}! You earned two stars!`,
      "You haven't written anything yet! Follow the letter outline with your finger.",
      'Good start! Trace more of the letter shape to complete it.',
    ];
    geminiTts.prefetchMany(currentSounds, { priority: 'high' });

    // 2. Upcoming letter sounds (Normal priority)
    if (nextLetter) {
      const nextSounds = [
        nextLetter.upper,
        `Sensational handwriting! You traced the letter ${nextLetter.upper} beautifully! You earned three stars!`,
      ];
      geminiTts.prefetchMany(nextSounds, { priority: 'normal' });
    }
  }, [currentLetter, nextLetter]);

  // PanResponder to track touch points on canvas
  const panResponder = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          canvasRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
            if (width > 0 && height > 0) {
              canvasLayoutRef.current = { x, y, width, height };
            }
          });
          lastPointRef.current = null;

          const { locationX, locationY, pageX, pageY } = evt.nativeEvent;
          const layout = canvasLayoutRef.current;
          let x = locationX;
          let y = locationY;

          if (layout.width > 0 && layout.height > 0) {
            const computedX = pageX - layout.x;
            const computedY = pageY - layout.y;
            if (
              computedX >= 0 &&
              computedX <= layout.width &&
              computedY >= 0 &&
              computedY <= layout.height
            ) {
              x = computedX;
              y = computedY;
            }
          }

          if (x >= 16 || y >= 16) {
            lastPointRef.current = { x, y };
            setPoints((prev) => [...prev, { x, y, color: activeColorRef.current }]);
          }
        },
        onPanResponderMove: (evt: GestureResponderEvent) => {
          const { locationX, locationY, pageX, pageY } = evt.nativeEvent;
          const layout = canvasLayoutRef.current;
          let x = locationX;
          let y = locationY;

          if (layout.width > 0 && layout.height > 0) {
            const computedX = pageX - layout.x;
            const computedY = pageY - layout.y;
            if (
              computedX >= 0 &&
              computedX <= layout.width &&
              computedY >= 0 &&
              computedY <= layout.height
            ) {
              x = computedX;
              y = computedY;
            }
          }

          if (x < 16 && y < 16) {
            return;
          }

          if (lastPointRef.current) {
            const dist = Math.hypot(x - lastPointRef.current.x, y - lastPointRef.current.y);
            if (dist > 75 && (x < 35 || y < 35)) {
              return;
            }
          }

          lastPointRef.current = { x, y };
          setPoints((prev) => [...prev, { x, y, color: activeColorRef.current }]);
        },
        onPanResponderRelease: () => {
          lastPointRef.current = null;
        },
        onPanResponderTerminate: () => {
          lastPointRef.current = null;
        },
      }),
    []
  );

  const handleClear = () => {
    lastPointRef.current = null;
    setPoints([]);
  };

  const handleHear = () => {
    soundService.speakLetterName(currentLetter);
  };

  const handleFinishPractice = async () => {
    // 1. Empty Check - Nothing was drawn
    if (points.length === 0) {
      const emptyEval: TracingEvaluation = {
        status: 'empty',
        starsAwarded: 0,
        scorePercent: 0,
        isLeftToRight: false,
        titleEn: 'Start Tracing! ✍️',
        titleHe: 'בואו נתחיל לכתוב! ✍️',
        messageEn: "You haven't written anything yet! Follow the letter outline with your finger.",
        messageHe: 'עדיין לא ציירתם דבר! עקבו עם האצבע אחרי קווי האות כדי לתרגל כתיבה.',
      };
      setEvaluationResult(emptyEval);
      await soundService.speak("You haven't written anything yet! Follow the letter outline with your finger.");
      return;
    }

    // 2. Stroke Length & Spatial Bounding Box Check
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const spanX = maxX - minX;
    const spanY = maxY - minY;

    if (points.length < 15 || (spanX < 35 && spanY < 35)) {
      const incompleteEval: TracingEvaluation = {
        status: 'incomplete',
        starsAwarded: 0,
        scorePercent: Math.min(35, Math.round((points.length / 25) * 40)),
        isLeftToRight: false,
        titleEn: 'Almost There! ✏️',
        titleHe: 'כמעט! המשיכו לכתוב ✏️',
        messageEn: 'Good start! Trace more of the letter shape to complete it.',
        messageHe: 'התחלה טובה! ציירו עוד מחלקי האות כדי להשלים את התרגול.',
      };
      setEvaluationResult(incompleteEval);
      await soundService.speak('Good start! Trace more of the letter shape to complete it.');
      return;
    }

    // 3. Direction Check (Left-to-Right bonus)
    const quarter = Math.max(2, Math.floor(points.length / 4));
    const startPoints = points.slice(0, quarter);
    const endPoints = points.slice(points.length - quarter);
    const avgStartX = startPoints.reduce((sum, p) => sum + p.x, 0) / startPoints.length;
    const avgEndX = endPoints.reduce((sum, p) => sum + p.x, 0) / endPoints.length;
    const isLeftToRight = avgEndX - avgStartX > 10;

    // 4. Quality Rating (2 or 3 stars)
    const isExcellent = points.length >= 35 && (spanY >= 65 || spanX >= 55);
    const stars = isExcellent ? 3 : 2;
    const score = isExcellent
      ? Math.min(100, Math.round(82 + points.length / 4))
      : Math.min(78, Math.round(55 + points.length / 2));

    const evalResult: TracingEvaluation = {
      status: isExcellent ? 'excellent' : 'good',
      starsAwarded: stars,
      scorePercent: score,
      isLeftToRight,
      titleEn: isExcellent ? 'Sensational Handwriting! 🌟🌟🌟' : 'Good Effort! 🌟🌟',
      titleHe: isExcellent ? 'כתיבה מעולה ומדויקת! 🌟🌟🌟' : 'עבודה יפה מאוד! 🌟🌟',
      messageEn: isExcellent
        ? `You traced the letter ${currentLetter.upper} beautifully! You earned 3 stars!`
        : `Nice tracing practice for the letter ${currentLetter.upper}! You earned 2 stars!`,
      messageHe: isExcellent
        ? `עקבתם אחרי האות ${currentLetter.upper} בצורה מושלמת וזכיתם ב-3 כוכבים!`
        : `תרגול יפה של האות ${currentLetter.upper}! זכיתם ב-2 כוכבים!`,
    };

    setEvaluationResult(evalResult);
    await soundService.playSuccessSound();
    onAddStars(stars);

    const praiseText = isExcellent
      ? `Sensational handwriting! You traced the letter ${currentLetter.upper} beautifully! You earned three stars!`
      : `Good job! You're learning how to write the letter ${currentLetter.upper}! You earned two stars!`;
    await soundService.speak(praiseText);
  };

  const handleProceedNext = () => {
    setEvaluationResult(null);
    setPoints([]);
    if (nextLetter) {
      setCurrentLetter(nextLetter);
      soundService.speakLetterName(nextLetter);
    }
  };

  const handleRetrySame = () => {
    setEvaluationResult(null);
    setPoints([]);
  };

  const handleContinueDrawing = () => {
    setEvaluationResult(null);
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
      <View
        ref={canvasRef}
        collapsable={false}
        onLayout={updateCanvasLayout}
        style={styles.canvasContainer}
        {...panResponder.panHandlers}
      >
        <View
          style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
          pointerEvents="none"
        >
          {/* Stroke counter badge */}
          <View style={styles.strokeBadge}>
            <Ionicons name="pencil" size={11} color="#64748B" />
            <Text style={styles.strokeBadgeText}>
              {points.length === 0
                ? (showHebrewHints ? 'התחילו לכתוב' : 'Trace here')
                : `${points.length} ${showHebrewHints ? 'נקודות' : 'strokes'}`}
            </Text>
          </View>

          {/* Background Guide Letter Outline */}
          <View style={styles.guideLetterContainer}>
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

      {/* Check Handwriting & Earn Stars Button */}
      <TouchableOpacity
        style={styles.doneBtn}
        onPress={handleFinishPractice}
        activeOpacity={0.85}
      >
        <Ionicons name="checkmark-done-circle" size={24} color="#FFFFFF" />
        <Text style={styles.doneBtnText}>
          {showHebrewHints ? 'בדיקת כתיבה וקבלת כוכבים 🌟' : 'Check Handwriting & Earn Stars 🌟'}
        </Text>
      </TouchableOpacity>

      {/* Examination Result Modal */}
      {evaluationResult && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setEvaluationResult(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              {/* Header Icon */}
              <View
                style={[
                  styles.modalIconCircle,
                  evaluationResult.status === 'excellent' && { backgroundColor: '#FEF08A' },
                  evaluationResult.status === 'good' && { backgroundColor: '#BBF7D0' },
                  (evaluationResult.status === 'incomplete' ||
                    evaluationResult.status === 'empty') && {
                    backgroundColor: '#FED7AA',
                  },
                ]}
              >
                <Text style={{ fontSize: 36 }}>
                  {evaluationResult.status === 'excellent'
                    ? '🌟'
                    : evaluationResult.status === 'good'
                    ? '✨'
                    : '✏️'}
                </Text>
              </View>

              {/* Title & Messages */}
              <Text style={styles.modalTitle}>
                {showHebrewHints ? evaluationResult.titleHe : evaluationResult.titleEn}
              </Text>
              <Text style={styles.modalMsg}>
                {showHebrewHints ? evaluationResult.messageHe : evaluationResult.messageEn}
              </Text>

              {/* Accuracy Bar for evaluated attempts */}
              {evaluationResult.scorePercent > 0 && (
                <View style={styles.scoreBox}>
                  <View style={styles.scoreHeader}>
                    <Text style={styles.scoreLabel}>
                      {showHebrewHints ? 'ציון דיוק והשלמה:' : 'Accuracy & Coverage:'}
                    </Text>
                    <Text style={styles.scoreValue}>{evaluationResult.scorePercent}%</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${evaluationResult.scorePercent}%`,
                          backgroundColor:
                            evaluationResult.status === 'excellent' ? '#10B981' : '#3B82F6',
                        },
                      ]}
                    />
                  </View>
                </View>
              )}

              {/* Left-to-Right Badge */}
              {evaluationResult.isLeftToRight && (
                <View style={styles.ltrBadge}>
                  <Ionicons name="arrow-forward-circle" size={16} color="#4361EE" />
                  <Text style={styles.ltrBadgeText}>
                    {showHebrewHints
                      ? 'נכתב משמאל לימין! (Left to Right)'
                      : 'Left-to-Right writing verified!'}
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                {evaluationResult.starsAwarded > 0 ? (
                  <>
                    <TouchableOpacity
                      style={styles.primaryModalBtn}
                      onPress={handleProceedNext}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.primaryModalBtnText}>
                        {showHebrewHints
                          ? `האות הבאה (${nextLetter.upper}) ➡️`
                          : `Next Letter (${nextLetter.upper}) ➡️`}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.secondaryModalBtn}
                      onPress={handleRetrySame}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="refresh" size={16} color="#64748B" />
                      <Text style={styles.secondaryModalBtnText}>
                        {showHebrewHints ? 'תרגול חוזר של אות זו' : 'Practice Again'}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.primaryModalBtn}
                      onPress={handleContinueDrawing}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="pencil" size={18} color="#FFFFFF" />
                      <Text style={styles.primaryModalBtnText}>
                        {showHebrewHints ? 'המשך ציור האות ✍️' : 'Keep Tracing ✍️'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.secondaryModalBtn}
                      onPress={handleRetrySame}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      <Text style={[styles.secondaryModalBtnText, { color: '#EF4444' }]}>
                        {showHebrewHints ? 'איפוס לוח' : 'Clear Canvas'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        </Modal>
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
  strokeBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  strokeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  modalIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalMsg: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  scoreBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  ltrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  ltrBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4361EE',
  },
  modalActions: {
    width: '100%',
    gap: 10,
  },
  primaryModalBtn: {
    backgroundColor: '#4361EE',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryModalBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  secondaryModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
});
