import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Share2, ShieldCheck, Timer, Users } from 'lucide-react-native';
import { PartyLoadState } from '../../components/party/PartyNotice';
import { PartyPage } from '../../components/party/PartyPage';
import { PartyParticipantRow } from '../../components/party/PartyParticipantRow';
import { PartyScreenHeader } from '../../components/party/PartyScreenHeader';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Icon } from '../../components/common/Icon';
import { ThemedText } from '../../components/common/ThemedText';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { useLeaveParty, useParty, usePartyRealtime, useStartParty } from '../../hooks/useParties';
import { partyRoute } from '../../services/parties';
import { useAuthStore } from '../../stores/useAuthStore';
import { usePartyStore } from '../../stores/usePartyStore';
import { formatDurationLabel, gameModeLabel } from '../../components/party/PartyCard';

export default function PartyLobbyScreen() {
  const offline = useAuthStore((state) => state.status === 'offline');
  const myUserId = useAuthStore((state) => state.session?.user.id);
  const partyId = usePartyStore((state) => state.activePartyId) ?? undefined;
  const setActivePartyId = usePartyStore((state) => state.setActivePartyId);
  const partyQuery = useParty(partyId);
  const party = partyQuery.data;
  const startParty = useStartParty();
  const leaveParty = useLeaveParty();
  const [error, setError] = useState('');
  usePartyRealtime(partyId);

  useEffect(() => {
    if (!partyId && !offline) router.replace('/parties');
    else if (party && party.status !== 'lobby') router.replace(partyRoute(party.status));
  }, [partyId, offline, party]);

  if (!party) {
    return (
      <PartyPage>
        <PartyScreenHeader title="Party lobby" subtitle="Get your crew together." backTo="/parties" />
        <PartyLoadState offline={offline} query={partyQuery} />
      </PartyPage>
    );
  }
  const isLeader = party.hostId === myUserId;
  const hasEnoughRunners = party.participants.length >= 2;

  // Server errors ('Need at least 2 runners', 'Only the host can start') land in the error slot unchanged.
  const run = async (action: () => Promise<unknown>) => {
    setError('');
    try {
      await action();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Something went wrong.');
    }
  };
  const leave = () => run(async () => {
    await leaveParty.mutateAsync(party.id);
    setActivePartyId(null);
    router.replace('/parties');
  });

  return (
    <PartyPage>
      <PartyScreenHeader title="Party lobby" subtitle="Get your crew together." backTo="/parties" />

      <Card padding="lg" style={styles.partyHero}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}><Icon icon={Users} size={22} color={Colors.primary} /></View>
          <View style={styles.heroCopy}>
            <ThemedText style={styles.partyName}>{party.name}</ThemedText>
            <ThemedText style={styles.modeName}>{gameModeLabel(party.gameMode)}</ThemedText>
          </View>
          <View style={styles.visibilityPill}>
            <Icon icon={party.visibility === 'private' ? ShieldCheck : Users} size={12} color={Colors.primary} />
            <ThemedText style={styles.visibilityText}>{party.visibility.toUpperCase()}</ThemedText>
          </View>
        </View>

        <View style={styles.rulesRow}>
          <Rule icon={Timer} label={formatDurationLabel(party.durationMinutes)} />
          <Rule icon={Users} label={`${party.maxParticipants} max`} />
        </View>

        <View style={styles.codeBox}>
          <View>
            <ThemedText style={styles.codeLabel}>INVITE CODE</ThemedText>
            <ThemedText style={styles.code}>{party.code}</ThemedText>
          </View>
          <Icon icon={Share2} size={17} color={Colors.textSecondary} />
        </View>
        <ThemedText style={styles.codeHint}>Share this code with friends so they can join your party.</ThemedText>
      </Card>

      <View style={styles.sectionRow}>
        <View>
          <ThemedText style={styles.sectionTitle}>Runners</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>{party.participants.length} of {party.maxParticipants} joined</ThemedText>
        </View>
        <View style={styles.readyPill}><View style={styles.readyDot} /><ThemedText style={styles.readyText}>LOBBY OPEN</ThemedText></View>
      </View>

      <Card padding="md" style={styles.roster}>
        {party.participants.map((participant) => (
          <PartyParticipantRow key={participant.id} participant={participant} />
        ))}
        {party.participants.length < party.maxParticipants ? (
          <ThemedText style={styles.waitingHint}>Waiting for more runners to join…</ThemedText>
        ) : null}
      </Card>

      {error ? <ThemedText style={styles.errorText} accessibilityRole="alert">{error}</ThemedText> : null}

      {isLeader ? (
        <>
          <Button
            title="START COMPETITION"
            size="lg"
            fullWidth
            disabled={!hasEnoughRunners}
            loading={startParty.isPending}
            onPress={() => void run(() => startParty.mutateAsync(party.id))}
            style={styles.startButton}
          />
          {!hasEnoughRunners ? <ThemedText style={styles.waitingHint}>Need at least 2 runners</ThemedText> : null}
        </>
      ) : (
        <View style={styles.waitingCard}>
          <ThemedText style={styles.waitingTitle}>Waiting for the party leader</ThemedText>
          <ThemedText style={styles.waitingBody}>The competition will begin when {party.participants.find((player) => player.id === party.hostId)?.username ?? 'the host'} starts it.</ThemedText>
        </View>
      )}

      <Button title="LEAVE PARTY" variant="ghost" loading={leaveParty.isPending} onPress={() => void leave()} />
    </PartyPage>
  );
}

function Rule({ icon, label }: { icon: typeof Timer; label: string }) {
  return <View style={styles.rule}><Icon icon={icon} size={14} color={Colors.textSecondary} /><ThemedText style={styles.ruleText}>{label}</ThemedText></View>;
}

const styles = StyleSheet.create({
  partyHero: { backgroundColor: Colors.surface, marginBottom: Spacing.xl },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  heroIcon: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  partyName: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },
  modeName: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, marginTop: 3 },
  visibilityPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 5 },
  visibilityText: { color: Colors.primary, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 0.6 },
  rulesRow: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderSubtle },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ruleText: { color: Colors.textSecondary, fontSize: 12, fontWeight: Typography.weights.medium },
  codeBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginTop: Spacing.md },
  codeLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 0.9 },
  code: { color: Colors.primary, fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, letterSpacing: 2, marginTop: 1 },
  codeHint: { color: Colors.textSecondary, fontSize: 12, marginTop: Spacing.xs },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  sectionTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold },
  sectionSubtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 3 },
  readyPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primaryMuted, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 5 },
  readyDot: { width: 5, height: 5, borderRadius: Radius.full, backgroundColor: Colors.primary },
  readyText: { color: Colors.primary, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 0.6 },
  roster: { paddingBottom: Spacing.xs, backgroundColor: Colors.surface, marginBottom: Spacing.lg },
  waitingHint: { color: Colors.textMuted, fontSize: 12, paddingVertical: Spacing.sm },
  startButton: { marginBottom: Spacing.sm },
  errorText: { color: Colors.danger, fontSize: 12, marginBottom: Spacing.sm },
  waitingCard: { padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', marginBottom: Spacing.sm },
  waitingTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  waitingBody: { color: Colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 4 },
});
