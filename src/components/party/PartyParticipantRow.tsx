import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Crown } from 'lucide-react-native';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { PartyParticipant } from '../../types/party';
import { Avatar } from '../common/Avatar';
import { Icon } from '../common/Icon';
import { ThemedText } from '../common/ThemedText';

export function PartyParticipantRow({ participant, rank, showStats = false }: {
  participant: PartyParticipant;
  rank?: number;
  showStats?: boolean;
}) {
  return (
    <View style={styles.row}>
      {rank !== undefined ? <ThemedText style={styles.rank}>{String(rank).padStart(2, '0')}</ThemedText> : null}
      <View style={styles.avatarWrap}>
        <Avatar name={participant.username} size={42} borderColor={participant.color} borderWidth={1.5} />
      </View>
      <View style={styles.nameBlock}>
        <View style={styles.nameRow}>
          <ThemedText style={styles.name} numberOfLines={1}>{participant.username}</ThemedText>
          {participant.isHost ? <Icon icon={Crown} size={13} color={Colors.primary} strokeWidth={2.2} /> : null}
        </View>
        {showStats ? (
          <ThemedText style={styles.subline}>{participant.territoryCapturedKm2.toFixed(3)} km² · {participant.distanceCoveredKm.toFixed(1)} km</ThemedText>
        ) : (
          <ThemedText style={styles.subline}>{participant.isHost ? 'PARTY LEADER' : 'READY'}</ThemedText>
        )}
      </View>
      {showStats ? (
        <View style={styles.scoreBlock}>
          <ThemedText style={styles.score}>{participant.score.toLocaleString()}</ThemedText>
          <ThemedText style={styles.scoreLabel}>PTS</ThemedText>
        </View>
      ) : (
        <View style={[styles.readyDot, participant.isHost && styles.hostDot]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  rank: {
    width: 28,
    color: Colors.textMuted,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },
  avatarWrap: {
    borderRadius: Radius.full,
    marginRight: Spacing.md,
  },
  nameBlock: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  subline: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  scoreBlock: {
    alignItems: 'flex-end',
    marginLeft: Spacing.sm,
  },
  score: {
    color: Colors.primary,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },
  scoreLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.7,
  },
  readyDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.secondary,
    marginHorizontal: Spacing.sm,
  },
  hostDot: {
    backgroundColor: Colors.primary,
  },
});
