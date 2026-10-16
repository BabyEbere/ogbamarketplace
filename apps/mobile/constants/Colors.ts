import { Platform } from 'react-native';

export const ForestGreen = '#1E5E3A';
export const DarkForest = '#164E2E';
export const LightGreen = '#EBF7EE';
export const AccentGold = '#D97706';
export const AccentRed = '#DC2626';

export const AppFont = Platform.select({
  ios: 'Times New Roman',
  android: 'serif',
  default: 'Times New Roman, serif',
});

export default {
  light: {
    text: '#111827',
    background: '#F8FAFC',
    tint: ForestGreen,
    tabIconDefault: '#94A3B8',
    tabIconSelected: ForestGreen,
    primary: ForestGreen,
    headerBackground: DarkForest,
    card: '#FFFFFF',
    border: '#E2E8F0',
  },
  dark: {
    text: '#F8FAFC',
    background: '#0F172A',
    tint: '#34D399',
    tabIconDefault: '#64748B',
    tabIconSelected: '#34D399',
    primary: ForestGreen,
    headerBackground: '#062817',
    card: '#1E293B',
    border: '#334155',
  },
};
