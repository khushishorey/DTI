import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { ThemedText } from '../common/ThemedText';

export function ProfileStatCard({ label, value, unit, icon }: {
  label: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>{icon}<ThemedText style={styles.label}>{label}</ThemedText></View>
      <View style={styles.valueRow}>
        <ThemedText style={styles.value}>{value}</ThemedText>
        {unit ? <ThemedText style={styles.unit}>{unit}</ThemedText> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexGrow: 1, width: '47%', minHeight: 88, padding: Spacing.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { color: Colors.textSecondary, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 0.7 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: Spacing.sm },
  value: { color: Colors.textPrimary, fontSize: Typography.sizes.xl, lineHeight: 26, fontWeight: Typography.weights.bold, fontVariant: ['tabular-nums'] },
  unit: { color: Colors.textSecondary, fontSize: 11, fontWeight: Typography.weights.semibold },
});
