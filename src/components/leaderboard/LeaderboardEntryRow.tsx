import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '../common/Avatar';
import { ThemedText } from '../common/ThemedText';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { LeaderboardEntry } from '../../types/user';

export function LeaderboardEntryRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <View style={[styles.row, entry.isCurrentUser && styles.currentRow]}>
      <ThemedText style={[styles.rank, entry.isCurrentUser && styles.currentRank]}>{String(entry.rank).padStart(2, '0')}</ThemedText>
      <Avatar name={entry.username} size={42} borderColor={entry.isCurrentUser ? Colors.primary : Colors.border} borderWidth={entry.isCurrentUser ? 2 : 1} />
      <View style={styles.player}>
        <View style={styles.nameLine}>
          <ThemedText style={[styles.username, entry.isCurrentUser && styles.currentUsername]} numberOfLines={1}>{entry.username}</ThemedText>
          {entry.isCurrentUser ? <View style={styles.youBadge}><ThemedText style={styles.youLabel}>YOU</ThemedText></View> : null}
        </View>
        <View style={styles.metrics}>
          <ThemedText style={styles.metric}>{entry.territoryCapturedKm2.toFixed(3)} km²</ThemedText>
          <View style={styles.metricDivider} />
          <ThemedText style={styles.metric}>{entry.distanceKm.toFixed(1)} km</ThemedText>
        </View>
      </View>
      <View style={styles.scoreColumn}>
        <ThemedText style={[styles.score, entry.isCurrentUser && styles.currentScore]}>{entry.score.toLocaleString()}</ThemedText>
        <ThemedText style={styles.scoreLabel}>PTS</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  currentRow: {
    backgroundColor: 'rgba(183, 243, 74, 0.07)',
    borderBottomColor: 'rgba(183, 243, 74, 0.18)',
  },
  rank: {
    width: 27,
    color: Colors.textMuted,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },
  currentRank: { color: Colors.primary },
  player: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  username: { flexShrink: 1, color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  currentUsername: { color: Colors.primary },
  youBadge: { borderRadius: Radius.full, backgroundColor: Colors.primaryMuted, paddingHorizontal: 5, paddingVertical: 2 },
  youLabel: { color: Colors.primary, fontSize: 7, fontWeight: Typography.weights.bold, letterSpacing: 0.4 },
  metrics: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 4 },
  metric: { color: Colors.textSecondary, fontSize: 9, fontVariant: ['tabular-nums'] },
  metricDivider: { width: 2, height: 2, borderRadius: Radius.full, backgroundColor: Colors.textMuted },
  scoreColumn: { alignItems: 'flex-end', minWidth: 48 },
  score: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, fontVariant: ['tabular-nums'] },
  currentScore: { color: Colors.primary },
  scoreLabel: { color: Colors.textMuted, fontSize: 7, fontWeight: Typography.weights.bold, letterSpacing: 0.8 },
});
