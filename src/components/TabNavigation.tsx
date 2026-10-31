import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type AppTab = 'letters' | 'match' | 'quiz' | 'trace' | 'blend';

interface TabNavigationProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

interface TabItem {
  id: AppTab;
  label: string;
  hebrewLabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const TABS: TabItem[] = [
  {
    id: 'letters',
    label: 'Letters',
    hebrewLabel: 'אותיות',
    icon: 'book',
    color: '#4361EE',
  },
  {
    id: 'match',
    label: 'Match',
    hebrewLabel: 'התאמה',
    icon: 'shapes',
    color: '#3A0CA3',
  },
  {
    id: 'quiz',
    label: 'Quiz',
    hebrewLabel: 'חידון שמע',
    icon: 'headset',
    color: '#7209B7',
  },
  {
    id: 'trace',
    label: 'Trace',
    hebrewLabel: 'ציור',
    icon: 'pencil',
    color: '#F72585',
  },
  {
    id: 'blend',
    label: 'Blend',
    hebrewLabel: 'מילים',
    icon: 'sparkles',
    color: '#4CC9F0',
  },
];

export const TabNavigation: React.FC<TabNavigationProps> = ({
  currentTab,
  onSelectTab,
}) => {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
            onPress={() => onSelectTab(tab.id)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconWrapper,
                isActive && { backgroundColor: tab.color },
              ]}
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={isActive ? '#FFFFFF' : '#64748B'}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                isActive && { color: tab.color, fontWeight: '800' },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
  },
  tabButtonActive: {
    backgroundColor: '#F8FAFC',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    backgroundColor: '#F1F5F9',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
});
