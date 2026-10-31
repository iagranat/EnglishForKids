import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { geminiTts, GeminiVoiceName, VoiceMode } from '../services/geminiTtsService';
import { ALPHABET_DATA } from '../data/alphabetData';

interface GeminiSettingsModalProps {
  visible: boolean;
  onClose: (newVoice?: GeminiVoiceName, newMode?: VoiceMode) => void;
}

interface TeacherVoiceItem {
  id: GeminiVoiceName;
  name: string;
  hebrewRole: string;
  desc: string;
  emoji: string;
  samplePhrase: string;
}

const TEACHER_VOICES: TeacherVoiceItem[] = [
  {
    id: 'Aoede',
    name: 'Aoede',
    hebrewRole: 'מורה חמה וידידותית',
    desc: 'Warm, clear, and encouraging female teacher (Recommended for kids)',
    emoji: '👩',
    samplePhrase: "Hello! I am teacher Aoede. Let's learn English letters and phonics together!",
  },
  {
    id: 'Puck',
    name: 'Puck',
    hebrewRole: 'קול עליז ומשחקי',
    desc: 'Playful, bouncy, and cheerful boy voice',
    emoji: '👦',
    samplePhrase: "Hey there! I am Puck! Ready to have fun with English sounds?",
  },
  {
    id: 'Kore',
    name: 'Kore',
    hebrewRole: 'קול רגוע וסבלני',
    desc: 'Gentle, soft, and patient tone',
    emoji: '🌸',
    samplePhrase: 'Hello! I am Kore. Take your time, you are doing wonderful!',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    hebrewRole: 'קול אנרגטי ובטוח',
    desc: 'Energetic, confident, and enthusiastic tone',
    emoji: '🦁',
    samplePhrase: 'Hello champion! I am Fenrir! Ready to conquer all twenty-six letters?',
  },
];

export const GeminiSettingsModal: React.FC<GeminiSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const [apiKey, setApiKey] = useState(() => geminiTts.getApiKey());
  const [selectedVoice, setSelectedVoice] = useState<GeminiVoiceName>(() => geminiTts.getVoice());
  const [voiceMode, setVoiceMode] = useState<VoiceMode>(() => geminiTts.getVoiceMode());
  const [previewingVoice, setPreviewingVoice] = useState<GeminiVoiceName | null>(null);
  const [showKeyEditor, setShowKeyEditor] = useState(() => !geminiTts.hasApiKey());
  const [cachedCount, setCachedCount] = useState(0);
  const [isPrewarming, setIsPrewarming] = useState(() => geminiTts.isPrewarmingActive());

  useEffect(() => {
    if (visible) {
      geminiTts.getCachedAudioCount().then((count) => setCachedCount(count));
    }

    const unsubscribe = geminiTts.subscribe(() => {
      geminiTts.getCachedAudioCount().then((count) => setCachedCount(count));
      setIsPrewarming(geminiTts.isPrewarmingActive());
    });
    return unsubscribe;
  }, [visible]);

  const handleSelectAndPreview = async (voiceItem: TeacherVoiceItem) => {
    setSelectedVoice(voiceItem.id);
    setPreviewingVoice(voiceItem.id);

    try {
      if (apiKey.trim()) {
        await geminiTts.setApiKey(apiKey);
      }
      await geminiTts.speak(voiceItem.samplePhrase, {
        voice: voiceItem.id,
        instantFallbackIfUncached: false, // For previews, await the actual AI sound
        onDone: () => setPreviewingVoice(null),
      });
    } catch {
      setPreviewingVoice(null);
    } finally {
      setTimeout(() => setPreviewingVoice(null), 3500);
    }
  };

  const handlePrewarmAll = () => {
    geminiTts.prewarmCommonSounds(ALPHABET_DATA);
  };

  const handleSave = async () => {
    if (apiKey.trim()) {
      await geminiTts.setApiKey(apiKey);
    }
    await geminiTts.setVoice(selectedVoice);
    await geminiTts.setVoiceMode(voiceMode);
    onClose(selectedVoice, voiceMode);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={() => onClose()}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.geminiBadge}>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.title}>Teacher Voice & Speed 👩‍🏫</Text>
                <Text style={styles.subtitle}>הגדרות קול המורה ומהירות התגובה</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => onClose()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={26} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
            {/* Status Banner */}
            {apiKey && apiKey.length > 10 ? (
              <View style={styles.statusBanner}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.statusText}>
                  Gemini Studio AI Active (Connected)
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.statusBanner, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
                onPress={() => setShowKeyEditor(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={[styles.statusText, { color: '#991B1B', flex: 1 }]}>
                  No API Key set. Using device voice. Tap to enter key!
                </Text>
              </TouchableOpacity>
            )}

            {/* Audio Engine Mode Selector */}
            <Text style={styles.sectionHeader}>Voice Latency & Engine Mode:</Text>
            <View style={styles.modeGrid}>
              {/* 1. Smart Hybrid */}
              <TouchableOpacity
                style={[styles.modeCard, voiceMode === 'hybrid' && styles.modeCardSelected]}
                onPress={() => setVoiceMode('hybrid')}
                activeOpacity={0.8}
              >
                <View style={styles.modeCardHeader}>
                  <Text style={styles.modeTitle}>🚀 Smart Hybrid</Text>
                  <View style={[styles.modeBadge, { backgroundColor: '#EDE9FE' }]}>
                    <Text style={[styles.modeBadgeText, { color: '#7209B7' }]}>Recommended</Text>
                  </View>
                </View>
                <Text style={styles.modeDesc}>
                  0ms instant response! Plays immediately without waiting, caches studio AI voice in the background for future taps.
                </Text>
              </TouchableOpacity>

              {/* 2. Instant Local */}
              <TouchableOpacity
                style={[styles.modeCard, voiceMode === 'native' && styles.modeCardSelected]}
                onPress={() => setVoiceMode('native')}
                activeOpacity={0.8}
              >
                <View style={styles.modeCardHeader}>
                  <Text style={styles.modeTitle}>⚡ Instant Device Voice</Text>
                  <View style={[styles.modeBadge, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[styles.modeBadgeText, { color: '#166534' }]}>0ms Lag</Text>
                  </View>
                </View>
                <Text style={styles.modeDesc}>
                  Uses on-device synthesizer. 100% offline, zero waiting time, perfectly responsive on all phones.
                </Text>
              </TouchableOpacity>

              {/* 3. Pure Gemini AI */}
              <TouchableOpacity
                style={[styles.modeCard, voiceMode === 'gemini' && styles.modeCardSelected]}
                onPress={() => setVoiceMode('gemini')}
                activeOpacity={0.8}
              >
                <View style={styles.modeCardHeader}>
                  <Text style={styles.modeTitle}>🌟 Studio Gemini AI Always</Text>
                  <View style={[styles.modeBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.modeBadgeText, { color: '#92400E' }]}>Pure AI</Text>
                  </View>
                </View>
                <Text style={styles.modeDesc}>
                  Studio AI voice for all audio. Plays instantly if cached; waits ~1-2s for new phrases.
                </Text>
              </TouchableOpacity>
            </View>

            {/* Cache Status Banner */}
            {voiceMode !== 'native' && (
              <View style={styles.cacheBanner}>
                <View style={styles.cacheInfo}>
                  <Ionicons name="disc-outline" size={18} color="#059669" />
                  <Text style={styles.cacheText}>
                    Cached Studio Audio: <Text style={{ fontWeight: '800' }}>{cachedCount}</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.prewarmBtn, isPrewarming && styles.prewarmBtnDisabled]}
                  onPress={handlePrewarmAll}
                  disabled={isPrewarming}
                  activeOpacity={0.7}
                >
                  {isPrewarming ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="cloud-download-outline" size={13} color="#FFFFFF" />
                      <Text style={styles.prewarmBtnText}>Pre-cache Letters</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Teacher Voice Cards */}
            <Text style={styles.sectionHeader}>Choose Your Preferred Teacher:</Text>
            <View style={styles.voiceGrid}>
              {TEACHER_VOICES.map((v) => {
                const isSelected = selectedVoice === v.id;
                const isPlaying = previewingVoice === v.id;

                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.voiceCard, isSelected && styles.voiceCardSelected]}
                    onPress={() => handleSelectAndPreview(v)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.voiceEmoji}>{v.emoji}</Text>

                    <View style={styles.voiceInfo}>
                      <View style={styles.voiceTitleRow}>
                        <Text style={[styles.voiceName, isSelected && styles.voiceNameSelected]}>
                          {v.name}
                        </Text>
                        <Text style={styles.voiceHebrewRole}>({v.hebrewRole})</Text>
                      </View>
                      <Text style={styles.voiceDesc}>{v.desc}</Text>
                    </View>

                    <View style={styles.voiceActionArea}>
                      {isPlaying ? (
                        <ActivityIndicator size="small" color="#7209B7" />
                      ) : (
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'volume-medium-outline'}
                          size={22}
                          color={isSelected ? '#7209B7' : '#94A3B8'}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Toggle API Key Settings */}
            <TouchableOpacity
              style={styles.keyToggleBtn}
              onPress={() => setShowKeyEditor((prev) => !prev)}
            >
              <Ionicons
                name={showKeyEditor ? 'chevron-up' : 'key-outline'}
                size={16}
                color="#64748B"
              />
              <Text style={styles.keyToggleText}>
                {showKeyEditor ? 'Hide API Key' : 'Edit Gemini API Key'}
              </Text>
            </TouchableOpacity>

            {showKeyEditor && (
              <View style={styles.keyEditorBox}>
                <Text style={styles.inputLabel}>Gemini API Key:</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="AQ.Ab8... or AIzaSy..."
                    placeholderTextColor="#94A3B8"
                    value={apiKey}
                    onChangeText={setApiKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={apiKey.length > 8}
                  />
                  {apiKey.length > 0 && (
                    <TouchableOpacity onPress={() => setApiKey('')} style={styles.clearBtn}>
                      <Ionicons name="close" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>
              Save Settings ✨
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  geminiBadge: {
    backgroundColor: '#7209B7',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 14,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
  },
  modeGrid: {
    gap: 8,
    marginBottom: 14,
  },
  modeCard: {
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  modeCardSelected: {
    borderColor: '#7209B7',
    backgroundColor: '#FAF5FF',
  },
  modeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  modeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modeDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  cacheBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 14,
  },
  cacheInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cacheText: {
    fontSize: 12,
    color: '#065F46',
  },
  prewarmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  prewarmBtnDisabled: {
    backgroundColor: '#6EE7B7',
  },
  prewarmBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  voiceGrid: {
    gap: 8,
    marginBottom: 14,
  },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  voiceCardSelected: {
    borderColor: '#7209B7',
    backgroundColor: '#FAF5FF',
    transform: [{ scale: 1.01 }],
  },
  voiceEmoji: {
    fontSize: 28,
  },
  voiceInfo: {
    flex: 1,
  },
  voiceTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  voiceName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  voiceNameSelected: {
    color: '#7209B7',
  },
  voiceHebrewRole: {
    fontSize: 11,
    color: '#7209B7',
    fontWeight: '700',
  },
  voiceDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 2,
  },
  voiceActionArea: {
    paddingLeft: 4,
  },
  keyToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 8,
  },
  keyToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  keyEditorBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  clearBtn: {
    padding: 4,
  },
  saveBtn: {
    backgroundColor: '#7209B7',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#7209B7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
