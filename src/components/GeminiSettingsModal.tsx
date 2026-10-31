import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { geminiTts, GeminiVoiceName } from '../services/geminiTtsService';

interface GeminiSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const VOICES: { id: GeminiVoiceName; name: string; desc: string; emoji: string }[] = [
  { id: 'Aoede', name: 'Aoede', desc: 'Warm & Friendly Teacher', emoji: '👩' },
  { id: 'Puck', name: 'Puck', desc: 'Playful & Cheerful', emoji: '👦' },
  { id: 'Kore', name: 'Kore', desc: 'Gentle & Calming', emoji: '🌸' },
  { id: 'Fenrir', name: 'Fenrir', desc: 'Energetic & Confident', emoji: '🦁' },
];

export const GeminiSettingsModal: React.FC<GeminiSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const [apiKey, setApiKey] = useState(() => geminiTts.getApiKey());
  const [selectedVoice, setSelectedVoice] = useState<GeminiVoiceName>(() => geminiTts.getVoice());
  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

  const handleSave = async () => {
    await geminiTts.setApiKey(apiKey);
    await geminiTts.setVoice(selectedVoice);
    onClose();
  };

  const handleTestVoice = async () => {
    setTesting(true);
    setTestSuccess(null);
    try {
      await geminiTts.setApiKey(apiKey);
      await geminiTts.setVoice(selectedVoice);
      await geminiTts.speak(
        "Hello! I am your English teacher. Let's learn the letters and their sounds together!",
        {
          voice: selectedVoice,
          onDone: () => setTesting(false),
        }
      );
      setTestSuccess(true);
    } catch {
      setTestSuccess(false);
    } finally {
      setTimeout(() => setTesting(false), 1500);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.geminiBadge}>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.title}>Gemini AI Voice 🌟</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={26} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Explanation */}
          <Text style={styles.explanation}>
            Connect Google Gemini for realistic, warm teacher voices, dynamic encouragements, and
            authentic phonics sounds!
          </Text>

          {/* API Key Input */}
          <Text style={styles.inputLabel}>Gemini API Key (Google AI Studio):</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="AIzaSy..."
              placeholderTextColor="#94A3B8"
              value={apiKey}
              onChangeText={setApiKey}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={apiKey.length > 5}
            />
            {apiKey.length > 0 && (
              <TouchableOpacity onPress={() => setApiKey('')} style={styles.clearBtn}>
                <Ionicons name="close" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Voice Selector */}
          <Text style={styles.inputLabel}>Teacher Voice:</Text>
          <View style={styles.voiceGrid}>
            {VOICES.map((v) => {
              const isSelected = selectedVoice === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.voiceCard, isSelected && styles.voiceCardSelected]}
                  onPress={() => setSelectedVoice(v.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.voiceEmoji}>{v.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.voiceName, isSelected && styles.voiceNameSelected]}>
                      {v.name}
                    </Text>
                    <Text style={styles.voiceDesc}>{v.desc}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color="#4361EE" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Test Voice Button */}
          <TouchableOpacity
            style={[styles.testBtn, testing && styles.testBtnDisabled]}
            onPress={handleTestVoice}
            disabled={testing}
            activeOpacity={0.8}
          >
            {testing ? (
              <ActivityIndicator size="small" color="#4361EE" />
            ) : (
              <Ionicons name="volume-high" size={20} color="#4361EE" />
            )}
            <Text style={styles.testBtnText}>
              {testing ? 'Speaking...' : 'Test Teacher Voice 🔊'}
            </Text>
          </TouchableOpacity>

          {testSuccess && (
            <Text style={styles.testSuccessText}>✅ Gemini voice working perfectly!</Text>
          )}

          {/* Save Button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Save & Apply Voice</Text>
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
    padding: 22,
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
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  geminiBadge: {
    backgroundColor: '#7209B7',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  explanation: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  clearBtn: {
    padding: 4,
  },
  voiceGrid: {
    gap: 8,
    marginBottom: 16,
  },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  voiceCardSelected: {
    borderColor: '#4361EE',
    backgroundColor: '#EEF2FF',
  },
  voiceEmoji: {
    fontSize: 22,
  },
  voiceName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  voiceNameSelected: {
    color: '#4361EE',
  },
  voiceDesc: {
    fontSize: 11,
    color: '#64748B',
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
    marginBottom: 12,
  },
  testBtnDisabled: {
    opacity: 0.6,
  },
  testBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4361EE',
  },
  testSuccessText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 8,
  },
  saveBtn: {
    backgroundColor: '#4361EE',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
