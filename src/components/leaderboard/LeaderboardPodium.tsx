import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Medal } from 'lucide-react-native';
import { LeaderboardEntry } from '../../types/user';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { Avatar } from '../common/Avatar';
import { Icon } from '../common/Icon';
import { ThemedText } from '../common/ThemedText';

const PODIUM = [Colors.textSecondary, Colors.primary, Colors.competitorOrange];

export function LeaderboardPodium({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length < 3) return null;
  const podiumEntries = [entries[1], entries[0], entries[2]];

  return (
    <View style={styles.podium}>
      {podiumEntries.map((entry, index) => (
        <View key={entry.userId} style={[styles.place, index === 1 && styles.firstPlace]}>
          <View style={styles.avatarWrap}>
            {index === 1 ? <Icon icon={Medal} size={14} color={entry.isCurrentUser ? Colors.primary : PODIUM[index]} strokeWidth={2.4} /> : null}
            <Avatar name={entry.username} size={index === 1 ? 58 : 48} borderColor={entry.isCurrentUser ? Colors.primary : PODIUM[index]} borderWidth={2} />
          </View>
          <ThemedText style={[styles.name, entry.isCurrentUser && styles.currentName]} numberOfLines={1}>{entry.username}{entry.isCurrentUser ? ' · YOU' : ''}</ThemedText>
          <ThemedText style={[styles.score, { color: entry.isCurrentUser ? Colors.primary : PODIUM[index] }]}>{entry.score.toLocaleString()} pts</ThemedText>
          <ThemedText style={styles.metrics}>{entry.territoryCapturedKm2.toFixed(3)} km² · {entry.distanceKm.toFixed(1)} km</ThemedText>
          <View style={[styles.block, { height: index === 1 ? 78 : index === 0 ? 56 : 44, borderColor: `${entry.isCurrentUser ? Colors.primary : PODIUM[index]}55` }]}>
            <ThemedText style={[styles.rank, { color: entry.isCurrentUser ? Colors.primary : PODIUM[index] }]}>{entry.rank}</ThemedText>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  place: { width: '31%', alignItems: 'center' },
  firstPlace: { marginBottom: 8 },
  avatarWrap: { height: 68, alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  name: { maxWidth: 92, color: Colors.textPrimary, fontSize: 9, fontWeight: Typography.weights.semibold, marginTop: 6 },
  currentName: { color: Colors.primary },
  score: { fontSize: 9, fontWeight: Typography.weights.bold, marginTop: 2, fontVariant: ['tabular-nums'] },
  metrics: { color: Colors.textSecondary, fontSize: 7, marginTop: 2, textAlign: 'center', fontVariant: ['tabular-nums'] },
  block: { width: '83%', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xs, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderBottomWidth: 0, borderTopLeftRadius: Radius.md, borderTopRightRadius: Radius.md },
  rank: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
});
