import React, { useState } from 'react';
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
import { geminiTts, GeminiVoiceName } from '../services/geminiTtsService';

interface GeminiSettingsModalProps {
  visible: boolean;
  onClose: (newVoice?: GeminiVoiceName) => void;
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
  const [previewingVoice, setPreviewingVoice] = useState<GeminiVoiceName | null>(null);
  const [showKeyEditor, setShowKeyEditor] = useState(false);

  const handleSelectAndPreview = async (voiceItem: TeacherVoiceItem) => {
    setSelectedVoice(voiceItem.id);
    setPreviewingVoice(voiceItem.id);

    try {
      if (apiKey.trim()) {
        await geminiTts.setApiKey(apiKey);
      }
      await geminiTts.speak(voiceItem.samplePhrase, {
        voice: voiceItem.id,
        onDone: () => setPreviewingVoice(null),
      });
    } catch {
      setPreviewingVoice(null);
    } finally {
      setTimeout(() => setPreviewingVoice(null), 2500);
    }
  };

  const handleSave = async () => {
    if (apiKey.trim()) {
      await geminiTts.setApiKey(apiKey);
    }
    await geminiTts.setVoice(selectedVoice);
    onClose(selectedVoice);
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
                <Text style={styles.title}>Select Teacher Voice 👩‍🏫</Text>
                <Text style={styles.subtitle}>בחרו את המורה המלווה ללימוד אנגלית</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => onClose()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={26} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
            {/* Status indicator */}
            <View style={styles.statusBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.statusText}>
                Gemini 2.0 AI Audio Active & Ready
              </Text>
            </View>

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
              Set {selectedVoice} as Active Teacher ✨
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
