import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { ThemedText } from '../common/ThemedText';

export type LeaderboardCategory = 'global' | 'nearby' | 'party';

const CATEGORIES: { id: LeaderboardCategory; label: string }[] = [
  { id: 'global', label: 'Global' },
  { id: 'nearby', label: 'Nearby' },
  { id: 'party', label: 'Party' },
];

export function LeaderboardCategoryTabs({ value, onChange }: {
  value: LeaderboardCategory;
  onChange: (category: LeaderboardCategory) => void;
}) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {CATEGORIES.map((category) => {
        const active = category.id === value;
        return (
          <Pressable
            key={category.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(category.id)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <ThemedText style={[styles.label, active && styles.labelActive]}>{category.label}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  labelActive: {
    color: Colors.textInverse,
    fontWeight: Typography.weights.bold,
  },
});
