import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Shield, Trophy } from 'lucide-react-native';
import { AppBottomNavigation } from '../../components/common/AppBottomNavigation';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import { ThemedText } from '../../components/common/ThemedText';
import { MOCK_NEARBY_PLAYERS } from '../../data/mockPlayers';
import { MOCK_EXPLORE_TERRITORIES } from '../../data/mockTerritories';
import { MOCK_PROFILE } from '../../data/mockProfile';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';

export default function PlayerProfileScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const player = MOCK_NEARBY_PLAYERS.find((item) => item.id === id);
  const isCurrentPlayer = id === MOCK_PROFILE.id;
  const username = isCurrentPlayer ? MOCK_PROFILE.username : player?.username ?? 'Runner';
  const level = isCurrentPlayer ? MOCK_PROFILE.level : player?.level ?? 1;
  const playerTerritories = MOCK_EXPLORE_TERRITORIES.filter((territory) => territory.ownerId === id);
  const capturedArea = playerTerritories.reduce((total, territory) => total + territory.areaKm2, 0);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/explore');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + 106 }]}>
        <Button title="BACK" variant="ghost" leftIcon={<Icon icon={ArrowLeft} size={17} color={Colors.textPrimary} />} onPress={handleBack} style={styles.backButton} />

        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Avatar name={username} source={player?.avatarUrl || undefined} size={82} borderColor={isCurrentPlayer ? Colors.primary : player?.territoryColor ?? Colors.primary} />
            <View style={styles.levelBadge}><ThemedText style={styles.levelText}>{level}</ThemedText></View>
          </View>
          <ThemedText style={styles.username}>{username}</ThemedText>
          <View style={styles.locationLine}>
            <Icon icon={MapPin} size={13} color={Colors.textSecondary} />
            <ThemedText style={styles.locationText}>Pacific Heights · San Francisco</ThemedText>
          </View>
          <View style={styles.statusLine}>
            <View style={[styles.onlineDot, { backgroundColor: player?.isOnline ? Colors.primary : Colors.textMuted }]} />
            <ThemedText style={styles.statusText}>{isCurrentPlayer ? 'Your profile' : player?.isOnline ? 'Running nearby' : 'Last seen nearby'}</ThemedText>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <ThemedText style={styles.sectionTitle}>Territory record</ThemedText>
          <Icon icon={Shield} size={17} color={Colors.primary} />
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Icon icon={MapPin} size={15} color={Colors.primary} />
            <ThemedText style={styles.statValue}>{capturedArea.toFixed(3)}</ThemedText>
            <ThemedText style={styles.statLabel}>KM² CLAIMED</ThemedText>
          </View>
          <View style={styles.statCard}>
            <Icon icon={Trophy} size={15} color={Colors.primary} />
            <ThemedText style={styles.statValue}>{playerTerritories.length}</ThemedText>
            <ThemedText style={styles.statLabel}>TERRITORIES</ThemedText>
          </View>
        </View>

        <ThemedText style={styles.sectionTitle}>Claimed ground</ThemedText>
        {playerTerritories.length ? playerTerritories.map((territory) => (
          <View key={territory.id} style={styles.territoryRow}>
            <View style={[styles.territorySwatch, { backgroundColor: territory.ownerColor }]} />
            <View style={styles.territoryCopy}>
              <ThemedText style={styles.territoryName}>{territory.name}</ThemedText>
              <ThemedText style={styles.territoryArea}>{territory.areaKm2.toFixed(3)} km² · {territory.status === 'contested' ? 'Contested' : 'Held'}</ThemedText>
            </View>
          </View>
        )) : (
          <View style={styles.emptyCard}><ThemedText style={styles.emptyText}>No territory records yet.</ThemedText></View>
        )}
      </ScrollView>
      <AppBottomNavigation activeTab="explore" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.lg },
  backButton: { alignSelf: 'flex-start', marginBottom: Spacing.md, paddingHorizontal: Spacing.sm },
  profileCard: { alignItems: 'center', padding: Spacing.xl, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl },
  avatarWrap: { position: 'relative', marginBottom: Spacing.md },
  levelBadge: { position: 'absolute', right: -3, bottom: 0, minWidth: 25, height: 25, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.surface },
  levelText: { color: Colors.textInverse, fontSize: 10, fontWeight: Typography.weights.black },
  username: { color: Colors.textPrimary, fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  locationLine: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing.xs },
  locationText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md },
  onlineDot: { width: 7, height: 7, borderRadius: Radius.full },
  statusText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.xl, marginBottom: Spacing.sm },
  sectionTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, marginBottom: Spacing.sm },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  statCard: { flex: 1, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  statValue: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, marginTop: Spacing.sm, fontVariant: ['tabular-nums'] },
  statLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 0.6, marginTop: 3 },
  territoryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  territorySwatch: { width: 10, height: 34, borderRadius: Radius.full },
  territoryCopy: { flex: 1 },
  territoryName: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  territoryArea: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, marginTop: 3 },
  emptyCard: { padding: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  emptyText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs },
});
