import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Award, Footprints, Flame, MapPin, MapPinned, Medal, Shield, Trophy, Users, Zap } from 'lucide-react-native';
import { AchievementCard } from '../components/profile/AchievementCard';
import { ActivityHistoryRow } from '../components/profile/ActivityHistoryRow';
import { ProfileStatCard } from '../components/profile/ProfileStatCard';
import { AppBottomNavigation } from '../components/common/AppBottomNavigation';
import { Avatar } from '../components/common/Avatar';
import { Icon } from '../components/common/Icon';
import { ThemedText } from '../components/common/ThemedText';
import { MOCK_ACHIEVEMENTS, MOCK_PROFILE, MOCK_RECENT_ACTIVITIES } from '../data/mockProfile';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import { Button } from '../components/common/Button';
import { signOut } from '../services/auth';
import { useAuthStore } from '../stores/useAuthStore';
import { useMyRuns, useMyStats } from '../hooks/useServerData';
import { deriveAchievements } from '../lib/achievements';
import type { MyStats } from '../services/stats';
import { runToActivity } from '../utils/runActivity';

// All achievements locked until real stats load.
const NO_STATS: MyStats = { totalDistanceKm: 0, totalDurationSeconds: 0, runCount: 0, cellsOwned: 0, areaOwnedKm2: 0, cellsCaptured: 0, xp: 0, level: 1 };

const ACHIEVEMENT_ICONS = {
  footprints: Footprints,
  territory: MapPinned,
  trophy: Trophy,
  streak: Flame,
  party: Users,
  distance: Zap,
} as const;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const offline = useAuthStore((state) => state.status === 'offline');
  const account = useAuthStore((state) => state.profile);
  const { data: stats } = useMyStats();
  const { data: runs, isLoading: runsLoading } = useMyRuns();
  // Online: only real profile, stats and runs (never mock). Offline demo mode: mock data.
  // Wins and streaks have no live source yet, so they only appear offline.
  const profile = offline
    ? MOCK_PROFILE
    : {
        username: account?.username ?? '',
        level: account?.level ?? 1,
        totalDistanceKm: stats?.totalDistanceKm ?? 0,
        totalTerritoryCapturedKm2: stats?.areaOwnedKm2 ?? 0,
        totalRunsCount: stats?.runCount ?? 0,
      };
  const accentColor = account?.color ?? Colors.primary;
  const xp = offline ? 2480 : account?.xp ?? 0;
  const xpIntoLevel = offline ? xp : xp % 1000;
  const xpForLevel = offline ? 3000 : 1000;
  const activities = offline ? MOCK_RECENT_ACTIVITIES : (runs ?? []).map((run) => runToActivity(run));
  const memberSince = offline
    ? 'FEB 2025'
    : account ? new Date(account.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }).toUpperCase() : '';
  const achievements = offline ? MOCK_ACHIEVEMENTS : deriveAchievements(stats ?? NO_STATS);
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + 104 }]}
      >
        <View style={styles.pageHeader}>
          <View>
            <ThemedText style={styles.pageTitle}>Profile</ThemedText>
            <ThemedText style={styles.pageSubtitle}>Your running record.</ThemedText>
          </View>
          {offline ? (
            <View style={styles.streakPill}>
              <Icon icon={Flame} size={14} color={Colors.competitorOrange} />
              <ThemedText style={styles.streakText}>7 DAY STREAK</ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileHeroRow}>
            <View style={styles.avatarFrame}>
              <Avatar name={profile.username} size={76} borderColor={accentColor} borderWidth={2} />
              <View style={styles.levelBadge}><ThemedText style={styles.levelBadgeText}>{profile.level}</ThemedText></View>
            </View>
            <View style={styles.profileCopy}>
              <ThemedText style={styles.username}>{profile.username}</ThemedText>
              {offline ? (
                <View style={styles.locationLine}>
                  <Icon icon={MapPin} size={12} color={Colors.textSecondary} />
                  <ThemedText style={styles.locationText}>San Francisco, CA</ThemedText>
                </View>
              ) : null}
              <ThemedText style={styles.memberSince}>RUNNER SINCE {memberSince}</ThemedText>
            </View>
            <View style={styles.levelPill}>
              <Icon icon={Shield} size={12} color={Colors.primary} />
              <ThemedText style={styles.levelPillText}>LVL {profile.level}</ThemedText>
            </View>
          </View>

          <View style={styles.levelProgressHeader}>
            <ThemedText style={styles.levelProgressLabel}>LEVEL PROGRESS</ThemedText>
            <ThemedText style={styles.levelProgressValue}>
              {xpIntoLevel.toLocaleString()} / {xpForLevel.toLocaleString()} XP
            </ThemedText>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round((xpIntoLevel / xpForLevel) * 100)}%` }]} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Career stats</ThemedText>
          <ThemedText style={styles.sectionMeta}>ALL TIME</ThemedText>
        </View>
        <View style={styles.statsGrid}>
          <ProfileStatCard label="TOTAL DISTANCE" value={profile.totalDistanceKm.toFixed(1)} unit="KM" icon={<Icon icon={Footprints} size={14} color={Colors.primary} />} />
          <ProfileStatCard label="TERRITORY" value={profile.totalTerritoryCapturedKm2.toFixed(3)} unit="KM²" icon={<Icon icon={MapPinned} size={14} color={Colors.primary} />} />
          <ProfileStatCard label="TOTAL RUNS" value={`${profile.totalRunsCount}`} icon={<Icon icon={Zap} size={14} color={Colors.primary} />} />
          {offline ? (
            <ProfileStatCard label="COMPETITION WINS" value={`${MOCK_PROFILE.winsCount}`} icon={<Icon icon={Trophy} size={14} color={Colors.primary} />} />
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <ThemedText style={styles.sectionTitle}>Achievements</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>{unlockedCount} unlocked · {achievements.length - unlockedCount} in progress</ThemedText>
          </View>
          <Icon icon={Award} size={18} color={Colors.primary} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementList}>
          {achievements.map((achievement) => {
            const AchievementIcon = ACHIEVEMENT_ICONS[achievement.icon];
            return (
              <AchievementCard
                key={achievement.id}
                name={achievement.name}
                description={achievement.description}
                unlocked={achievement.unlocked}
                progress={achievement.progress}
                icon={<Icon icon={AchievementIcon} size={19} color={achievement.unlocked ? Colors.primary : Colors.textMuted} strokeWidth={2.1} />}
              />
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <View>
            <ThemedText style={styles.sectionTitle}>Recent activity</ThemedText>
            <ThemedText style={styles.sectionSubtitle}>Your latest miles and captures.</ThemedText>
          </View>
          <Icon icon={Medal} size={17} color={Colors.textSecondary} />
        </View>
        {!offline && !runsLoading && activities.length === 0 ? (
          <View style={styles.emptyActivity}>
            <ThemedText style={styles.emptyActivityTitle}>No runs yet</ThemedText>
            <ThemedText style={styles.emptyActivityText}>Start a run from the map to claim your first cells.</ThemedText>
          </View>
        ) : null}
        <View style={[styles.activityList, activities.length === 0 && styles.hidden]}>
          {activities.map((activity) => (
            <ActivityHistoryRow
              key={activity.id}
              title={activity.title}
              subtitle={activity.subtitle}
              date={activity.date}
              distance={`${activity.distanceKm.toFixed(1)} km`}
              territory={activity.territoryKm2.toFixed(3)}
              accent={activity.color}
              icon={<Icon icon={Footprints} size={17} color={activity.color} strokeWidth={2.1} />}
            />
          ))}
        </View>
        {account ? (
          <Button
            title="LOG OUT"
            variant="ghost"
            fullWidth
            onPress={() => void signOut()}
            style={styles.signOut}
          />
        ) : null}
      </ScrollView>

      <AppBottomNavigation activeTab="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  signOut: { marginTop: Spacing.xl },
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.lg },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  pageTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.bold },
  pageSubtitle: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, marginTop: 2 },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 7 },
  streakText: { color: Colors.textPrimary, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 0.6 },
  profileCard: { padding: Spacing.lg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl },
  profileHeroRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatarFrame: { position: 'relative' },
  levelBadge: { position: 'absolute', right: -3, bottom: -3, minWidth: 23, height: 23, borderRadius: Radius.full, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  levelBadgeText: { color: Colors.textInverse, fontSize: 11, fontWeight: Typography.weights.black },
  profileCopy: { flex: 1, minWidth: 0 },
  username: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  locationLine: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locationText: { color: Colors.textSecondary, fontSize: 12 },
  memberSince: { color: Colors.textMuted, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 0.7, marginTop: 7 },
  levelPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 5, borderRadius: Radius.full, backgroundColor: Colors.primaryMuted },
  levelPillText: { color: Colors.primary, fontSize: 11, fontWeight: Typography.weights.bold },
  levelProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.lg, marginBottom: Spacing.xs },
  levelProgressLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 0.7 },
  levelProgressValue: { color: Colors.textSecondary, fontSize: 11, fontVariant: ['tabular-nums'] },
  progressTrack: { height: 5, backgroundColor: Colors.surfaceHighlight, borderRadius: Radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Radius.full, backgroundColor: Colors.primary },
  emptyActivity: { padding: Spacing.lg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg },
  emptyActivityTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  emptyActivityText: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  hidden: { display: 'none' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xl, marginBottom: Spacing.md },
  sectionTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
  sectionSubtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 3 },
  sectionMeta: { color: Colors.textMuted, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 0.8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  achievementList: { gap: Spacing.sm, paddingBottom: Spacing.xs },
  activityList: { paddingHorizontal: Spacing.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg },
});
