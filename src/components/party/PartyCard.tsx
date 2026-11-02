import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LockKeyhole, Timer, Users, Zap } from 'lucide-react-native';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { Party, PartyGameMode } from '../../types/party';
import { Button } from '../common/Button';
import { Icon } from '../common/Icon';
import { ThemedText } from '../common/ThemedText';
import { Avatar } from '../common/Avatar';

interface PartyCardProps {
  party: Party;
  onPress: () => void;
  actionLabel: string;
}

export function PartyCard({ party, onPress, actionLabel }: PartyCardProps) {
  const isLive = party.status === 'in_progress';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.topRow}>
        <View style={styles.modeIcon}>
          <Icon icon={modeIcon(party.gameMode)} size={19} color={Colors.primary} strokeWidth={2.1} />
        </View>
        <View style={styles.partyCopy}>
          <View style={styles.nameRow}>
            <ThemedText style={styles.name} numberOfLines={1}>{party.name}</ThemedText>
            {party.visibility === 'private' ? <Icon icon={LockKeyhole} size={13} color={Colors.textSecondary} /> : null}
          </View>
          <ThemedText style={styles.mode}>{gameModeLabel(party.gameMode)}</ThemedText>
        </View>
        <View style={[styles.statusPill, isLive && styles.statusLive]}>
          {isLive ? <View style={styles.liveDot} /> : null}
          <ThemedText style={[styles.statusText, isLive && styles.statusTextLive]}>
            {isLive ? 'LIVE' : 'LOBBY'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Meta icon={Users} label={`${party.participants.length}/${party.maxParticipants}`} />
        <Meta icon={Timer} label={formatDurationLabel(party.durationMinutes)} />
        <ThemedText style={styles.host}>HOST · {party.participants.find((player) => player.id === party.hostId)?.username ?? 'Runner'}</ThemedText>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.avatarStack}>
          {party.participants.slice(0, 4).map((player) => (
            <View key={player.id} style={styles.avatarWrap}>
              <Avatar
                name={player.username}
                size={28}
                borderColor={player.color}
                borderWidth={1.5}
              />
            </View>
          ))}
        </View>
        <Button
          title={actionLabel}
          size="sm"
          onPress={() => onPress()}
          style={styles.actionButton}
        />
      </View>
    </Pressable>
  );
}

function Meta({ icon, label }: { icon: typeof Users; label: string }) {
  return (
    <View style={styles.metaItem}>
      <Icon icon={icon} size={13} color={Colors.textSecondary} strokeWidth={2} />
      <ThemedText style={styles.metaText}>{label}</ThemedText>
    </View>
  );
}

export function gameModeLabel(mode: PartyGameMode) {
  if (mode === 'territory_control') return 'Territory Control';
  if (mode === 'distance_race') return 'Distance Race';
  return 'King of the Hill';
}

export function formatDurationLabel(minutes: number) {
  if (minutes === 1440) return '24 hours';
  if (minutes >= 60) return `${minutes / 60} hour${minutes >= 120 ? 's' : ''}`;
  return `${minutes} min`;
}

function modeIcon(mode: PartyGameMode) {
  return mode === 'distance_race' ? Timer : mode === 'king_of_the_hill' ? Zap : Users;
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  modeIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partyCopy: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  mode: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  statusLive: {
    backgroundColor: Colors.primaryMuted,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: 8,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.7,
  },
  statusTextLive: {
    color: Colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  host: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'right',
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  avatarWrap: {
    marginRight: -6,
  },
  avatar: {
    width: 27,
    height: 27,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginRight: -6,
  },
  avatarInitial: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
  actionButton: {
    minWidth: 92,
  },
});
