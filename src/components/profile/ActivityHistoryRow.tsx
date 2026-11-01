import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { ThemedText } from '../common/ThemedText';

export function ActivityHistoryRow({ title, subtitle, date, distance, territory, accent, icon }: {
  title: string;
  subtitle: string;
  date: string;
  distance: string;
  territory: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: `${accent}20` }]}>{icon}</View>
      <View style={styles.copy}>
        <ThemedText style={styles.title} numberOfLines={1}>{title}</ThemedText>
        <ThemedText style={styles.subtitle} numberOfLines={1}>{subtitle}</ThemedText>
        <ThemedText style={styles.date}>{date}</ThemedText>
      </View>
      <View style={styles.metrics}>
        <ThemedText style={styles.distance}>{distance}</ThemedText>
        <ThemedText style={styles.territory}>{territory} km²</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  iconWrap: { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  title: { color: Colors.textPrimary, fontSize: 11, fontWeight: Typography.weights.semibold },
  subtitle: { color: Colors.textSecondary, fontSize: 9, marginTop: 2 },
  date: { color: Colors.textMuted, fontSize: 8, marginTop: 4 },
  metrics: { alignItems: 'flex-end' },
  distance: { color: Colors.textPrimary, fontSize: 10, fontWeight: Typography.weights.bold, fontVariant: ['tabular-nums'] },
  territory: { color: Colors.primary, fontSize: 8, fontWeight: Typography.weights.medium, marginTop: 3, fontVariant: ['tabular-nums'] },
});
