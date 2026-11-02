import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Compass, Plus, Search } from 'lucide-react-native';
import { PartyCard } from '../../components/party/PartyCard';
import { PartyPage } from '../../components/party/PartyPage';
import { PartyScreenHeader } from '../../components/party/PartyScreenHeader';
import { AppBottomNavigation } from '../../components/common/AppBottomNavigation';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import { ThemedText } from '../../components/common/ThemedText';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { usePartyStore } from '../../stores/usePartyStore';
import { PartyStatus } from '../../types/party';
import { CURRENT_PLAYER_ID } from '../../data/mockParties';

type PartyFilter = 'all' | 'lobby' | 'live';

export default function PartyDiscoveryScreen() {
  const parties = usePartyStore((state) => state.parties);
  const activeParty = usePartyStore((state) => state.activeParty);
  const joinParty = usePartyStore((state) => state.joinParty);
  const [filter, setFilter] = useState<PartyFilter>('all');
  const visibleParties = useMemo(
    () => parties.filter((party) => party.visibility === 'public' && party.status !== 'completed' &&
      (party.participants.length < party.maxParticipants || party.participants.some((player) => player.id === CURRENT_PLAYER_ID)) &&
      (filter === 'all' || (filter === 'live' ? party.status === 'in_progress' : party.status === 'lobby'))),
    [parties, filter],
  );

  const openParty = (partyId: string, status: PartyStatus) => {
    joinParty(partyId);
    router.push(status === 'in_progress' ? '/parties/leaderboard' : '/parties/lobby');
  };

  return (
    <View style={styles.screen}>
      <PartyPage hasBottomNav>
        <PartyScreenHeader title="Parties" subtitle="Find your crew. Own the streets." showBack={false} />

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon icon={Compass} size={22} color={Colors.primary} strokeWidth={2.1} />
          </View>
          <View style={styles.heroCopy}>
            <ThemedText style={styles.heroTitle}>Run it together.</ThemedText>
            <ThemedText style={styles.heroSubtitle}>Compete in live territory challenges around the city.</ThemedText>
          </View>
        </View>

        {activeParty ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Active party: ${activeParty.name}`}
            onPress={() => router.push(activeParty.status === 'in_progress' ? '/parties/leaderboard' : activeParty.status === 'completed' ? '/parties/results' : '/parties/lobby')}
            style={styles.activePartyBanner}
          >
            <View style={styles.activeDot} />
            <View style={styles.activePartyCopy}>
              <ThemedText style={styles.activePartyEyebrow}>YOUR ACTIVE PARTY</ThemedText>
              <ThemedText style={styles.activePartyName}>{activeParty.name}</ThemedText>
            </View>
            <ThemedText style={styles.activeArrow}>›</ThemedText>
          </Pressable>
        ) : null}

        <View style={styles.actionRow}>
          <Button title="CREATE PARTY" leftIcon={<Icon icon={Plus} size={16} color={Colors.textInverse} strokeWidth={2.7} />} onPress={() => router.push('/parties/create')} style={styles.createButton} />
          <Button title="JOIN WITH CODE" variant="secondary" leftIcon={<Icon icon={Search} size={15} color={Colors.textPrimary} />} onPress={() => router.push('/parties/join')} style={styles.joinButton} />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <ThemedText style={styles.sectionTitle}>Around you</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>{visibleParties.length} parties open to join</ThemedText>
          </View>
          <View style={styles.liveCount}>
            <View style={styles.activeDot} />
            <ThemedText style={styles.liveCountText}>LIVE</ThemedText>
          </View>
        </View>

        <View style={styles.filters}>
          {([
            ['all', 'All parties'],
            ['lobby', 'Starting soon'],
            ['live', 'Live now'],
          ] as const).map(([key, label]) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === key }}
              onPress={() => setFilter(key)}
              style={[styles.filterChip, filter === key && styles.filterChipActive]}
            >
              <ThemedText style={[styles.filterText, filter === key && styles.filterTextActive]}>{label}</ThemedText>
            </Pressable>
          ))}
        </View>

        {visibleParties.length > 0 ? visibleParties.map((party) => (
          <PartyCard
            key={party.id}
            party={party}
            actionLabel={party.status === 'in_progress' ? 'VIEW LIVE' : 'JOIN PARTY'}
            onPress={() => openParty(party.id, party.status)}
          />
        )) : (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyTitle}>No parties in this view</ThemedText>
            <ThemedText style={styles.emptyBody}>Create a party and invite your crew to start a challenge.</ThemedText>
          </View>
        )}
      </PartyPage>

      <AppBottomNavigation activeTab="parties" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1 },
  heroTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },
  heroSubtitle: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, lineHeight: 17, marginTop: 3 },
  activePartyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(183, 243, 74, 0.35)',
    marginBottom: Spacing.lg,
  },
  activeDot: { width: 7, height: 7, borderRadius: Radius.full, backgroundColor: Colors.primary },
  activePartyCopy: { flex: 1 },
  activePartyEyebrow: { color: Colors.secondary, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 1 },
  activePartyName: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, marginTop: 2 },
  activeArrow: { color: Colors.primary, fontSize: 24, lineHeight: 28 },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xxl },
  createButton: { flex: 1, paddingHorizontal: Spacing.sm },
  joinButton: { flex: 1, paddingHorizontal: Spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  sectionTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold },
  sectionSubtitle: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, marginTop: 3 },
  liveCount: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.surfaceElevated, paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radius.full },
  liveCountText: { color: Colors.primary, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 0.8 },
  filters: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  filterChip: { borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  filterText: { color: Colors.textSecondary, fontSize: 12, fontWeight: Typography.weights.medium },
  filterTextActive: { color: Colors.primary, fontWeight: Typography.weights.bold },
  emptyState: { padding: Spacing.xl, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  emptyTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  emptyBody: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, textAlign: 'center', marginTop: Spacing.xs },
});
