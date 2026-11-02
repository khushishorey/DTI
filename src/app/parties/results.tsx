import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Award, MapPin, Trophy, Users } from 'lucide-react-native';
import { PartyPage } from '../../components/party/PartyPage';
import { PartyParticipantRow } from '../../components/party/PartyParticipantRow';
import { PartyScreenHeader } from '../../components/party/PartyScreenHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Icon } from '../../components/common/Icon';
import { ThemedText } from '../../components/common/ThemedText';
import { Avatar } from '../../components/common/Avatar';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { usePartyStore } from '../../stores/usePartyStore';

const PODIUM_COLORS = [Colors.primary, Colors.textSecondary, Colors.competitorOrange];

export default function PartyResultsScreen() {
  const party = usePartyStore((state) => state.activeParty);
  const clearActiveParty = usePartyStore((state) => state.clearActiveParty);

  useEffect(() => {
    if (!party) router.replace('/parties');
    else if (party.status === 'in_progress') router.replace('/parties/leaderboard');
    else if (party.status === 'lobby') router.replace('/parties/lobby');
  }, [party]);

  if (!party) return null;
  const standings = [...party.participants].sort((a, b) => b.score - a.score);
  const totalArea = standings.reduce((sum, player) => sum + player.territoryCapturedKm2, 0);
  const totalDistance = standings.reduce((sum, player) => sum + player.distanceCoveredKm, 0);
  const podium = [standings[1], standings[0], standings[2]];
  const podiumRank = [2, 1, 3];

  return (
    <PartyPage>
      <PartyScreenHeader title="Party results" subtitle={party.name} backTo="/parties" />

      <View style={styles.resultHero}>
        <View style={styles.trophyMark}><Icon icon={Trophy} size={26} color={Colors.primary} strokeWidth={2.1} /></View>
        <ThemedText style={styles.eyebrow}>COMPETITION COMPLETE</ThemedText>
        <ThemedText style={styles.winnerName}>{standings[0]?.username ?? 'Runners'}</ThemedText>
        <ThemedText style={styles.winnerCaption}>TAKES THE TERRITORY</ThemedText>

        <View style={styles.podium}>
          {podium.map((participant, index) => participant ? (
            <View key={participant.id} style={[styles.podiumPlace, index === 1 && styles.podiumFirst]}>
              <Avatar
                name={participant.username}
                size={48}
                borderColor={PODIUM_COLORS[index]}
                borderWidth={2}
              />
              <ThemedText style={styles.podiumUsername} numberOfLines={1}>{participant.username}</ThemedText>
              <ThemedText style={[styles.podiumScore, { color: PODIUM_COLORS[index] }]}>{participant.score.toLocaleString()}</ThemedText>
              <View style={[styles.podiumBlock, { height: index === 1 ? 72 : index === 0 ? 54 : 42, borderColor: `${PODIUM_COLORS[index]}50` }]}>
                <ThemedText style={[styles.podiumRank, { color: PODIUM_COLORS[index] }]}>{podiumRank[index]}</ThemedText>
              </View>
            </View>
          ) : <View key={`empty-${index}`} style={styles.podiumPlace} />)}
        </View>
      </View>

      <View style={styles.statsRow}>
        <ResultStat icon={Users} value={`${party.participants.length}`} label="RUNNERS" />
        <ResultStat icon={MapPin} value={`${totalArea.toFixed(2)} km²`} label="CAPTURED" />
        <ResultStat icon={Award} value={`${totalDistance.toFixed(1)} km`} label="TOTAL DISTANCE" />
      </View>

      <View style={styles.standingsHeader}>
        <ThemedText style={styles.standingsTitle}>Final standings</ThemedText>
        <ThemedText style={styles.pointsLabel}>SCORE</ThemedText>
      </View>
      <View style={styles.standingsList}>
        {standings.map((participant, index) => (
          <PartyParticipantRow key={participant.id} participant={participant} rank={index + 1} showStats />
        ))}
      </View>

      <Button title="BACK TO PARTIES" size="lg" fullWidth onPress={() => { clearActiveParty(); router.replace('/parties'); }} style={styles.backButton} />
    </PartyPage>
  );
}

function ResultStat({ icon, value, label }: { icon: typeof Users; value: string; label: string }) {
  return (
    <Card padding="md" style={styles.statCard}>
      <Icon icon={icon} size={15} color={Colors.primary} />
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  resultHero: { alignItems: 'center', padding: Spacing.xl, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl },
  trophyMark: { width: 52, height: 52, borderRadius: Radius.full, backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  eyebrow: { color: Colors.textSecondary, fontSize: 11, letterSpacing: 1.4, fontWeight: Typography.weights.bold },
  winnerName: { color: Colors.textPrimary, fontSize: Typography.sizes.xxl, lineHeight: 30, fontWeight: Typography.weights.bold, marginTop: Spacing.xs },
  winnerCaption: { color: Colors.primary, fontSize: 11, letterSpacing: 1, fontWeight: Typography.weights.bold, marginTop: 3 },
  podium: { width: '100%', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginTop: Spacing.xl },
  podiumPlace: { width: '31%', alignItems: 'center' },
  podiumFirst: { marginBottom: 8 },
  podiumAvatar: { width: 48, height: 48, borderRadius: Radius.full, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  podiumInitial: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  podiumUsername: { maxWidth: 90, color: Colors.textPrimary, fontSize: 12, fontWeight: Typography.weights.semibold, marginTop: 6 },
  podiumScore: { fontSize: 12, fontWeight: Typography.weights.bold, marginTop: 2, fontVariant: ['tabular-nums'] },
  podiumBlock: { width: '86%', backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderBottomWidth: 0, borderTopLeftRadius: Radius.md, borderTopRightRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xs },
  podiumRank: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  statsRow: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.md },
  statCard: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.xs, backgroundColor: Colors.surface },
  statValue: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, marginTop: Spacing.xs, fontVariant: ['tabular-nums'] },
  statLabel: { color: Colors.textMuted, fontSize: 11, textAlign: 'center', fontWeight: Typography.weights.bold, letterSpacing: 0.5, marginTop: 2 },
  standingsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xl, marginBottom: Spacing.sm },
  standingsTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  pointsLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 0.7 },
  standingsList: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, paddingHorizontal: Spacing.md },
  backButton: { marginTop: Spacing.lg },
});
