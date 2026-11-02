import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Clock3, Flag, Trophy } from 'lucide-react-native';
import { PartyPage } from '../../components/party/PartyPage';
import { PartyParticipantRow } from '../../components/party/PartyParticipantRow';
import { PartyScreenHeader } from '../../components/party/PartyScreenHeader';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import { Modal } from '../../components/common/Modal';
import { ThemedText } from '../../components/common/ThemedText';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { usePartyStore } from '../../stores/usePartyStore';
import { gameModeLabel } from '../../components/party/PartyCard';

export default function PartyLeaderboardScreen() {
  const party = usePartyStore((state) => state.activeParty);
  const completeCompetition = usePartyStore((state) => state.completeCompetition);
  const [now, setNow] = useState(Date.now());
  const [confirmFinish, setConfirmFinish] = useState(false);

  useEffect(() => {
    if (!party) {
      router.replace('/parties');
      return;
    }
    if (party.status === 'completed') {
      router.replace('/parties/results');
      return;
    }
    if (party.status !== 'in_progress') {
      router.replace('/parties/lobby');
      return;
    }

    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      const latestParty = usePartyStore.getState().activeParty;
      if (latestParty?.endsAt && latestParty.endsAt <= current) {
        usePartyStore.getState().completeCompetition();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [party?.id, party?.status]);

  if (!party) return null;
  const remainingSeconds = Math.max(0, Math.ceil(((party.endsAt ?? now) - now) / 1000));
  const totalSeconds = party.durationMinutes * 60;
  const elapsedRatio = Math.min(1, Math.max(0, 1 - remainingSeconds / totalSeconds));
  const isLeader = party.hostId === 'player-me';
  const participants = [...party.participants].sort((a, b) => b.score - a.score);

  const finishCompetition = () => {
    setConfirmFinish(false);
    completeCompetition();
  };

  return (
    <PartyPage>
      <PartyScreenHeader title="Live leaderboard" subtitle={party.name} backTo="/parties" />

      <View style={styles.liveHero}>
        <View style={styles.liveLabel}><View style={styles.liveDot} /><ThemedText style={styles.liveLabelText}>COMPETITION LIVE</ThemedText></View>
        <ThemedText style={styles.mode}>{gameModeLabel(party.gameMode).toUpperCase()}</ThemedText>
        <View style={styles.timerRow}>
          <Icon icon={Clock3} size={17} color={Colors.primary} strokeWidth={2.2} />
          <ThemedText style={styles.countdown}>{formatCountdown(remainingSeconds)}</ThemedText>
        </View>
        <ThemedText style={styles.timerCaption}>TIME REMAINING</ThemedText>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${elapsedRatio * 100}%` }]} /></View>
        <View style={styles.statsRow}>
          <MiniStat label="RUNNERS" value={`${party.participants.length}`} />
          <View style={styles.statDivider} />
          <MiniStat label="TERRITORY" value={`${party.participants.reduce((sum, player) => sum + player.territoryCapturedKm2, 0).toFixed(2)} km²`} />
          <View style={styles.statDivider} />
          <MiniStat label="LEADER" value={participants[0]?.username ?? '—'} />
        </View>
      </View>

      <View style={styles.listHeading}>
        <View style={styles.headingTitleRow}>
          <Icon icon={Trophy} size={17} color={Colors.primary} />
          <ThemedText style={styles.listTitle}>Current standings</ThemedText>
        </View>
        <ThemedText style={styles.pointsLabel}>POINTS</ThemedText>
      </View>

      <View style={styles.roster}>
        {participants.map((participant, index) => (
          <PartyParticipantRow key={participant.id} participant={participant} rank={index + 1} showStats />
        ))}
      </View>

      <View style={styles.liveNote}>
        <Icon icon={Flag} size={14} color={Colors.secondary} />
        <ThemedText style={styles.liveNoteText}>Scores update as runners capture ground and cover distance.</ThemedText>
      </View>

      {isLeader ? (
        <Button title="END COMPETITION" variant="destructive" onPress={() => setConfirmFinish(true)} style={styles.endButton} />
      ) : null}

      <Modal
        visible={confirmFinish}
        onClose={() => setConfirmFinish(false)}
        title="End the competition?"
        description="The current standings will be saved and everyone will see the results."
        dismissOnBackdrop={false}
        primaryAction={{ label: 'End competition', variant: 'destructive', onPress: finishCompetition }}
        secondaryAction={{ label: 'Keep playing', onPress: () => setConfirmFinish(false) }}
      />
    </PartyPage>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <View style={styles.miniStat}><ThemedText style={styles.miniStatValue} numberOfLines={1}>{value}</ThemedText><ThemedText style={styles.miniStatLabel}>{label}</ThemedText></View>;
}

export function formatCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  liveHero: { padding: Spacing.lg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, marginBottom: Spacing.xl },
  liveLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: Colors.primaryMuted, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 5 },
  liveDot: { width: 6, height: 6, borderRadius: Radius.full, backgroundColor: Colors.primary },
  liveLabelText: { color: Colors.primary, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 0.8 },
  mode: { color: Colors.textSecondary, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 1.2, textAlign: 'center', marginTop: Spacing.md },
  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  countdown: { color: Colors.textPrimary, fontSize: 40, lineHeight: 48, fontWeight: Typography.weights.bold, letterSpacing: 1.4, fontVariant: ['tabular-nums'] },
  timerCaption: { color: Colors.textSecondary, fontSize: 11, letterSpacing: 1.2, fontWeight: Typography.weights.bold, textAlign: 'center' },
  progressTrack: { height: 5, backgroundColor: Colors.surfaceHighlight, borderRadius: Radius.full, marginTop: Spacing.lg, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: Radius.full },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.lg },
  miniStat: { flex: 1, alignItems: 'center' },
  miniStatValue: { maxWidth: '100%', color: Colors.textPrimary, fontSize: 13, fontWeight: Typography.weights.bold },
  miniStatLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 0.7, marginTop: 3 },
  statDivider: { width: 1, height: 24, backgroundColor: Colors.border },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  headingTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  listTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  pointsLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 0.7 },
  roster: { paddingHorizontal: Spacing.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg },
  liveNote: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, marginTop: Spacing.md, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md },
  liveNoteText: { flex: 1, color: Colors.textSecondary, fontSize: 12 },
  endButton: { marginTop: Spacing.lg },
});
