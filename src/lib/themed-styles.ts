import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useAppSettings } from '../context/app-settings-context';

const DARK_COLORS: Record<string, string> = {
  '#F6F7F9': '#0F1115',
  '#FFFFFF': '#191C22',
  '#111827': '#F9FAFB',
  '#374151': '#E5E7EB',
  '#4B5563': '#D1D5DB',
  '#6B7280': '#A7AFBD',
  '#9CA3AF': '#7E8796',
  '#D1D5DB': '#4B5563',
  '#E5E7EB': '#303640',
  '#F0F1F3': '#2B313A',
  '#F3F4F6': '#242932',
  '#EEF2FF': '#252944',
  '#E0F2FE': '#133044',
  '#ECFDF5': '#143329',
  '#F3E8FF': '#302442',
  '#FFF7ED': '#33271D',
  '#FEF2F2': '#371F24',
  '#FCA5A5': '#7F3038',
  '#FEF3C7': '#3A311A',
  '#DCFCE7': '#163725',
  '#FEE2E2': '#3B2024',
  '#E9ECF1': '#2B313A',
};

function mapStyle(style: Record<string, unknown>) {
  const mapped: Record<string, unknown> = {};
  Object.entries(style).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const normalized = value.toUpperCase();

      if (key === 'color' && normalized === '#FFFFFF') {
        mapped[key] = '#FFFFFF';
      } else if (key !== 'color' && normalized === '#111827') {
        mapped[key] = '#252A33';
      } else {
        mapped[key] = DARK_COLORS[normalized] ?? value;
      }
    } else {
      mapped[key] = value;
    }
  });
  return mapped;
}

export function useAppStyles<T extends Record<string, any>>(lightStyles: T): T {
  const { isDark } = useAppSettings();

  return useMemo(() => {
    if (!isDark) return lightStyles;

    const mapped = Object.fromEntries(
      Object.entries(lightStyles).map(([key, value]) => [
        key,
        mapStyle(StyleSheet.flatten(value) ?? {}),
      ])
    );

    return StyleSheet.create(mapped) as T;
  }, [isDark, lightStyles]);
}
