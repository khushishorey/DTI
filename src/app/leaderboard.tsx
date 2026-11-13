import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Award, Globe2, MapPin, Trophy, Users } from 'lucide-react-native';
import { AppBottomNavigation } from '../components/common/AppBottomNavigation';
import { Icon } from '../components/common/Icon';
import { ThemedText } from '../components/common/ThemedText';
import { LeaderboardCategoryTabs, LeaderboardCategory } from '../components/leaderboard/LeaderboardCategoryTabs';
import { LeaderboardEntryRow } from '../components/leaderboard/LeaderboardEntryRow';
import { LeaderboardPodium } from '../components/leaderboard/LeaderboardPodium';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import { DEMO_BOUNDS } from '../constants/map';
import { getPartyRankings, MOCK_GLOBAL_RANKINGS, MOCK_NEARBY_RANKINGS } from '../data/mockLeaderboard';
import { MOCK_PARTIES } from '../data/mockParties';
import { useParty } from '../hooks/useParties';
import { useGlobalLeaderboard, useNearbyLeaderboard, usePartyLeaderboard } from '../hooks/useServerData';
import { PartyNotice } from '../components/party/PartyNotice';
import { snapBounds } from '../services/territory';
import { useAuthStore } from '../stores/useAuthStore';
import { usePartyStore } from '../stores/usePartyStore';
import { LeaderboardEntry } from '../types/user';

const NEARBY_BOUNDS = snapBounds(DEMO_BOUNDS); // no stored map bounds yet

const CATEGORY_INFO = {
  global: { title: 'Global leaders', subtitle: 'The top runners across run.io.', icon: Globe2 },
  nearby: { title: 'Around you', subtitle: 'Runners active in your area.', icon: MapPin },
  party: { title: 'Party standings', subtitle: 'Your crew’s current rankings.', icon: Users },
} as const;

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<LeaderboardCategory>('global');
  const offline = useAuthStore((state) => state.status === 'offline');
  const activePartyId = usePartyStore((state) => state.activePartyId);
  const { data: activeParty } = useParty(activePartyId ?? undefined);
  const globalQuery = useGlobalLeaderboard();
  const nearbyQuery = useNearbyLeaderboard(NEARBY_BOUNDS);
  const partyQuery = usePartyLeaderboard(activePartyId ?? undefined);

  const needsParty = category === 'party' && !activePartyId && !offline;
  const query = category === 'nearby' ? nearbyQuery : category === 'party' ? partyQuery : globalQuery;
  const partyName = offline ? MOCK_PARTIES[0].name : activeParty?.name ?? 'Your party';

  // Offline demo keeps the mock rankings; online never falls back to them.
  const entries = useMemo<LeaderboardEntry[]>(() => {
    if (offline) {
      if (category === 'nearby') return MOCK_NEARBY_RANKINGS;
      if (category === 'party') return getPartyRankings(MOCK_PARTIES[0]);
      return MOCK_GLOBAL_RANKINGS;
    }
    return query.data ?? [];
  }, [offline, category, query.data]);

  const info = CATEGORY_INFO[category];
  const CategoryIcon = info.icon;
  const leaders = entries.slice(0, 3);
  const remainingEntries = entries.slice(3);

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + 104 }]}
      >
        <View style={styles.pageHeader}>
          <View>
            <ThemedText style={styles.pageTitle}>Leaderboard</ThemedText>
            <ThemedText style={styles.pageSubtitle}>Every run moves you up.</ThemedText>
          </View>
          <View style={styles.rankIcon}><Icon icon={Trophy} size={20} color={Colors.primary} strokeWidth={2.1} /></View>
        </View>

        <LeaderboardCategoryTabs value={category} onChange={setCategory} />

        <View style={styles.categoryHeading}>
          <View style={styles.categoryIcon}><Icon icon={CategoryIcon} size={16} color={Colors.primary} strokeWidth={2.1} /></View>
          <View style={styles.categoryCopy}>
            <ThemedText style={styles.categoryTitle}>{info.title}</ThemedText>
            <ThemedText style={styles.categorySubtitle}>{category === 'party' ? partyName : info.subtitle}</ThemedText>
          </View>
          <View style={styles.seasonPill}><Icon icon={Award} size={11} color={Colors.secondary} /><ThemedText style={styles.seasonText}>{category === 'party' ? 'LIVE' : 'SEASON 04'}</ThemedText></View>
        </View>

        {needsParty ? (
          <PartyNotice title="Join a party to see standings" body="Standings show once you're in a party." actionLabel="FIND A PARTY" onAction={() => router.push('/parties')} />
        ) : !offline && query.isError ? (
          <PartyNotice title="Couldn’t load the leaderboard" body={query.error.message} actionLabel="TRY AGAIN" onAction={() => void query.refetch()} />
        ) : !offline && query.isPending ? (
          <PartyNotice loading title="Loading rankings…" />
        ) : entries.length === 0 ? (
          <PartyNotice title="No runners here yet" body="Capture some territory to get on the board." />
        ) : (
          <>
            <View style={styles.podiumCard}>
              <LeaderboardPodium entries={leaders} />
            </View>

            <View style={styles.listHeader}>
              <ThemedText style={styles.listTitle}>{category === 'party' ? 'Party rankings' : 'Rankings'}</ThemedText>
              <View style={styles.columnLabels}>
                <ThemedText style={styles.columnLabel}>TERRITORY · DISTANCE</ThemedText>
              </View>
            </View>

            {remainingEntries.length > 0 ? (
              <View style={styles.rankingList}>
                {remainingEntries.map((entry) => <LeaderboardEntryRow key={entry.userId} entry={entry} />)}
              </View>
            ) : null}
          </>
        )}
        <View style={styles.scoreHint}>
          <Icon icon={Trophy} size={13} color={Colors.textMuted} />
          <ThemedText style={styles.scoreHintText}>Score combines territory captured, distance, and competition wins.</ThemedText>
        </View>
      </ScrollView>

      <AppBottomNavigation activeTab="leaderboard" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.lg },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  pageTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold },
  pageSubtitle: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, marginTop: 2 },
  rankIcon: { width: 42, height: 42, borderRadius: Radius.md, backgroundColor: Colors.primaryMuted, borderWidth: 1, borderColor: 'rgba(183, 243, 74, 0.25)', alignItems: 'center', justifyContent: 'center' },
  categoryHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  categoryIcon: { width: 34, height: 34, borderRadius: Radius.md, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  categoryCopy: { flex: 1 },
  categoryTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  categorySubtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  seasonPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated },
  seasonText: { color: Colors.secondary, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 0.7 },
  podiumCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, paddingHorizontal: Spacing.xs, marginBottom: Spacing.lg },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  listTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  columnLabels: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  columnLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 0.6 },
  rankingList: { overflow: 'hidden', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg },
  scoreHint: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.xs, paddingTop: Spacing.md },
  scoreHintText: { flex: 1, color: Colors.textMuted, fontSize: 11, lineHeight: 16 },
});
