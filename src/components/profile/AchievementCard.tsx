import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { ThemedText } from '../common/ThemedText';

export function AchievementCard({ name, description, icon, unlocked, progress }: {
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  progress?: string;
}) {
  return (
    <View style={[styles.card, unlocked ? styles.unlocked : styles.locked]}>
      <View style={[styles.iconWrap, unlocked ? styles.iconUnlocked : styles.iconLocked]}>{icon}</View>
      <ThemedText style={[styles.name, !unlocked && styles.lockedText]} numberOfLines={1}>{name}</ThemedText>
      <ThemedText style={[styles.description, !unlocked && styles.lockedText]} numberOfLines={2}>{description}</ThemedText>
      {progress ? <ThemedText style={styles.progress}>{progress}</ThemedText> : <ThemedText style={styles.unlockedLabel}>UNLOCKED</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 150, minHeight: 166, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1 },
  unlocked: { backgroundColor: Colors.surface, borderColor: Colors.border },
  locked: { backgroundColor: Colors.surface, borderColor: Colors.borderSubtle, opacity: 0.8 },
  iconWrap: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  iconUnlocked: { backgroundColor: Colors.primaryMuted },
  iconLocked: { backgroundColor: Colors.surfaceElevated },
  name: { color: Colors.textPrimary, fontSize: 12, fontWeight: Typography.weights.bold, marginTop: Spacing.sm },
  description: { color: Colors.textSecondary, fontSize: 11, lineHeight: 15, marginTop: 4, minHeight: 30 },
  lockedText: { color: Colors.textMuted },
  progress: { color: Colors.textSecondary, fontSize: 11, fontWeight: Typography.weights.bold, marginTop: Spacing.sm },
  unlockedLabel: { color: Colors.primary, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 0.6, marginTop: Spacing.sm },
});
