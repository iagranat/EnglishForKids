import React, { useState, useEffect } from 'react';
import { StyleSheet, View, BackHandler } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

import { Header } from './src/components/Header';
import { TabNavigation, AppTab } from './src/components/TabNavigation';
import { GeminiSettingsModal } from './src/components/GeminiSettingsModal';
import { LettersScreen } from './src/screens/LettersScreen';
import { CaseMatchScreen } from './src/screens/CaseMatchScreen';
import { PhonicsQuizScreen } from './src/screens/PhonicsQuizScreen';
import { TracingScreen } from './src/screens/TracingScreen';
import { WordBlendScreen } from './src/screens/WordBlendScreen';
import { LetterItem, ALPHABET_DATA } from './src/data/alphabetData';
import { geminiTts, GeminiVoiceName, VoiceMode } from './src/services/geminiTtsService';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('letters');
  const [tabHistory, setTabHistory] = useState<AppTab[]>(['letters']);
  const [stars, setStars] = useState(10); // Start with 10 welcome stars!
  const [showHebrewHints, setShowHebrewHints] = useState(true);
  const [tracingLetter, setTracingLetter] = useState<LetterItem>(ALPHABET_DATA[0]);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [currentVoice, setCurrentVoice] = useState<GeminiVoiceName>(() => geminiTts.getVoice());
  const [voiceMode, setVoiceMode] = useState<VoiceMode>(() => geminiTts.getVoiceMode());

  const handleSelectTab = (tab: AppTab) => {
    if (tab === currentTab) return;
    geminiTts.clearPendingPrefetch();
    setCurrentTab(tab);
    setTabHistory((prev) => [...prev, tab]);
  };

  const handleAddStars = (amount: number) => {
    setStars((prev) => prev + amount);
  };

  const handleGoToTrace = (letter: LetterItem) => {
    setTracingLetter(letter);
    handleSelectTab('trace');
  };

  // Intercept Android hardware back button
  useEffect(() => {
    const onBackPress = () => {
      // 1. Close Gemini modal if open
      if (showGeminiModal) {
        setShowGeminiModal(false);
        return true;
      }

      // 2. Go back to previous screen in history
      if (tabHistory.length > 1) {
        setTabHistory((prev) => {
          const next = [...prev];
          next.pop();
          const prevTab = next[next.length - 1] || 'letters';
          setCurrentTab(prevTab);
          return next;
        });
        return true;
      }

      // 3. If on a sub-screen without history, go to main Letters tab
      if (currentTab !== 'letters') {
        setCurrentTab('letters');
        setTabHistory(['letters']);
        return true;
      }

      // 4. On home screen: allow system back (exit / minimize)
      return false;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );
    return () => subscription.remove();
  }, [showGeminiModal, tabHistory, currentTab]);

  const renderScreen = () => {
    switch (currentTab) {
      case 'letters':
        return (
          <LettersScreen
            showHebrewHints={showHebrewHints}
            onGoToTrace={handleGoToTrace}
          />
        );
      case 'match':
        return (
          <CaseMatchScreen
            showHebrewHints={showHebrewHints}
            onAddStars={handleAddStars}
          />
        );
      case 'quiz':
        return (
          <PhonicsQuizScreen
            showHebrewHints={showHebrewHints}
            onAddStars={handleAddStars}
          />
        );
      case 'trace':
        return (
          <TracingScreen
            showHebrewHints={showHebrewHints}
            initialLetter={tracingLetter}
            onAddStars={handleAddStars}
          />
        );
      case 'blend':
        return (
          <WordBlendScreen
            showHebrewHints={showHebrewHints}
            onAddStars={handleAddStars}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <Header
          stars={stars}
          showHebrewHints={showHebrewHints}
          onToggleHebrewHints={() => setShowHebrewHints((prev) => !prev)}
          onOpenGeminiSettings={() => setShowGeminiModal(true)}
          currentVoice={currentVoice}
          voiceMode={voiceMode}
        />
        <View style={styles.contentContainer}>{renderScreen()}</View>
        <TabNavigation currentTab={currentTab} onSelectTab={handleSelectTab} />

        <GeminiSettingsModal
          visible={showGeminiModal}
          onClose={(newVoice, newMode) => {
            setShowGeminiModal(false);
            if (newVoice) {
              setCurrentVoice(newVoice);
            }
            if (newMode) {
              setVoiceMode(newMode);
            }
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
