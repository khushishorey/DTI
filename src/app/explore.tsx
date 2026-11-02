import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocateFixed, MapPin, Search, Users } from 'lucide-react-native';
import { AppBottomNavigation } from '../components/common/AppBottomNavigation';
import { Avatar } from '../components/common/Avatar';
import { BottomSheet } from '../components/common/BottomSheet';
import { Button } from '../components/common/Button';
import { Icon } from '../components/common/Icon';
import { Input } from '../components/common/Input';
import { ThemedText } from '../components/common/ThemedText';
import { MapHomeView } from '../components/map/MapHomeView';
import { MOCK_NEARBY_PLAYERS } from '../data/mockPlayers';
import { MOCK_EXPLORE_TERRITORIES } from '../data/mockTerritories';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import { Territory } from '../types/territory';

const FILTERS = ['All', 'Yours', 'Rivals', 'Unclaimed', 'Contested'] as const;
type TerritoryFilter = typeof FILTERS[number];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<TerritoryFilter>('All');
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [centerOnLocationKey, setCenterOnLocationKey] = useState(0);
  const [centerMessage, setCenterMessage] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();

  const visibleTerritories = useMemo(() => MOCK_EXPLORE_TERRITORIES.filter((territory) => {
    const status = territory.status ?? 'owned';
    const matchesFilter = filter === 'All'
      || (filter === 'Yours' && territory.isCurrentPlayer)
      || (filter === 'Rivals' && !territory.isCurrentPlayer && status === 'owned')
      || (filter === 'Unclaimed' && status === 'unclaimed')
      || (filter === 'Contested' && status === 'contested');
    const matchesSearch = !normalizedQuery
      || territory.name.toLowerCase().includes(normalizedQuery)
      || territory.ownerName.toLowerCase().includes(normalizedQuery);
    return matchesFilter && matchesSearch;
  }), [filter, normalizedQuery]);

  const visiblePlayers = useMemo(() => {
    if (!normalizedQuery) return MOCK_NEARBY_PLAYERS;
    const playerMatches = MOCK_NEARBY_PLAYERS.filter((player) => player.username.toLowerCase().includes(normalizedQuery));
    return playerMatches.length ? playerMatches : MOCK_NEARBY_PLAYERS;
  }, [normalizedQuery]);

  const selectedOwner = selectedTerritory
    ? MOCK_NEARBY_PLAYERS.find((player) => player.id === selectedTerritory.ownerId)
    : undefined;
  const selectedStatus = selectedTerritory ? getStatus(selectedTerritory) : undefined;

  const centerOnLocation = () => {
    setCenterOnLocationKey((value) => value + 1);
    setCenterMessage(true);
    setTimeout(() => {
      setCenterMessage(false);
    }, 2500);
  };

  const openOwnerProfile = () => {
    if (!selectedTerritory || selectedStatus === 'Unclaimed') return;
    const ownerId = selectedTerritory.ownerId;
    setSelectedTerritory(null);
    router.push({ pathname: '/player/[id]', params: { id: ownerId } });
  };

  return (
    <View style={styles.screen}>
      <MapHomeView
        onSelectTerritory={setSelectedTerritory}
        territories={visibleTerritories}
        players={visiblePlayers}
        centerOnLocationKey={centerOnLocationKey}
      />

      <View style={[styles.topPanel, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <ThemedText style={styles.title}>Explore Territories</ThemedText>
            <ThemedText style={styles.subtitle}>Find your next patch of ground.</ThemedText>
          </View>
          <View style={styles.territoryCount}>
            <Icon icon={MapPin} size={13} color={Colors.primary} />
            <ThemedText style={styles.countText}>{visibleTerritories.length}</ThemedText>
          </View>
        </View>

        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search players or locations"
          accessibilityLabel="Search players or locations"
          autoCapitalize="none"
          autoCorrect={false}
          clearable
          leftIcon={<Icon icon={Search} size={17} color={Colors.textSecondary} />}
          inputContainerStyle={styles.searchInput}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((item) => {
            const active = item === filter;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setFilter(item)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <ThemedText style={[styles.filterText, active && styles.filterTextActive]}>{item}</ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.mapLegend, { bottom: insets.bottom + 86 }]} pointerEvents="none">
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.primary }]} /><ThemedText style={styles.legendText}>YOURS</ThemedText></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.competitorOrange }]} /><ThemedText style={styles.legendText}>RIVALS</ThemedText></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: Colors.textSecondary }]} /><ThemedText style={styles.legendText}>OPEN</ThemedText></View>
      </View>

      <View style={[styles.mapActions, { bottom: insets.bottom + 84 }]}>
        {centerMessage ? <ThemedText style={styles.centerMessage}>Centered on your location</ThemedText> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Center map on your current location"
          onPress={centerOnLocation}
          style={({ pressed }) => [styles.locationButton, pressed && styles.locationButtonPressed]}
        >
          <Icon icon={LocateFixed} size={20} color={Colors.primary} strokeWidth={2.2} />
        </Pressable>
      </View>

      {visibleTerritories.length === 0 ? (
        <View style={styles.noResults} pointerEvents="none">
          <ThemedText style={styles.noResultsTitle}>No territories found</ThemedText>
          <ThemedText style={styles.noResultsText}>Try another filter or search term.</ThemedText>
        </View>
      ) : null}

      <AppBottomNavigation activeTab="explore" />

      <BottomSheet
        visible={Boolean(selectedTerritory)}
        onClose={() => setSelectedTerritory(null)}
        title={selectedTerritory?.name}
        subtitle={selectedTerritory ? `${selectedTerritory.areaKm2.toFixed(3)} km² captured` : undefined}
        scrollable
      >
        {selectedTerritory ? (
          <View style={styles.sheetContent}>
            <View style={styles.ownerRow}>
              <Avatar
                name={selectedOwner?.username ?? selectedTerritory.ownerName}
                source={selectedOwner?.avatarUrl || undefined}
                size={52}
                borderColor={selectedTerritory.ownerColor}
              />
              <View style={styles.ownerCopy}>
                <ThemedText style={styles.ownerLabel}>TERRITORY OWNER</ThemedText>
                <ThemedText style={styles.ownerName} numberOfLines={1}>
                  {selectedTerritory.status === 'unclaimed' ? 'No owner' : selectedTerritory.ownerName.replace('You (', '').replace(')', '')}
                </ThemedText>
                {selectedOwner ? <ThemedText style={styles.ownerLevel}>Level {selectedOwner.level} · {selectedOwner.isOnline ? 'Online' : 'Offline'}</ThemedText> : null}
              </View>
              <View style={[styles.statusPill, getStatusStyle(selectedStatus)]}>
                <ThemedText style={[styles.statusText, getStatusTextStyle(selectedStatus)]}>{selectedStatus}</ThemedText>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailCard}>
                <ThemedText style={styles.detailValue}>{selectedTerritory.areaKm2.toFixed(3)}</ThemedText>
                <ThemedText style={styles.detailLabel}>KM² AREA</ThemedText>
              </View>
              <View style={styles.detailCard}>
                <ThemedText style={styles.detailValue}>{selectedTerritory.status === 'unclaimed' ? 'Open ground' : formatCaptureDate(selectedTerritory.capturedAt)}</ThemedText>
                <ThemedText style={styles.detailLabel}>{selectedTerritory.status === 'unclaimed' ? 'READY TO CLAIM' : 'LAST CAPTURED'}</ThemedText>
              </View>
            </View>

            <Button
              title={selectedStatus === 'Unclaimed' ? 'UNCLAIMED TERRITORY' : 'VIEW PROFILE'}
              variant={selectedStatus === 'Unclaimed' ? 'secondary' : 'primary'}
              fullWidth
              disabled={selectedStatus === 'Unclaimed'}
              onPress={openOwnerProfile}
              leftIcon={<Icon icon={selectedStatus === 'Unclaimed' ? MapPin : Users} size={16} color={selectedStatus === 'Unclaimed' ? Colors.textSecondary : Colors.textInverse} />}
              style={styles.profileButton}
            />
          </View>
        ) : null}
      </BottomSheet>
    </View>
  );
}

function getStatus(territory: Territory): 'Yours' | 'Rival' | 'Unclaimed' | 'Contested' {
  if (territory.status === 'unclaimed') return 'Unclaimed';
  if (territory.status === 'contested') return 'Contested';
  return territory.isCurrentPlayer ? 'Yours' : 'Rival';
}

function getStatusStyle(status?: string) {
  if (status === 'Contested') return { backgroundColor: Colors.warningMuted };
  if (status === 'Unclaimed') return { backgroundColor: Colors.surfaceHighlight };
  return { backgroundColor: Colors.primaryMuted };
}

function getStatusTextStyle(status?: string) {
  if (status === 'Contested') return { color: Colors.warning };
  if (status === 'Unclaimed') return { color: Colors.textSecondary };
  return { color: Colors.primary };
}

function formatCaptureDate(value: string) {
  if (!value) return 'Recently';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  topPanel: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, backgroundColor: 'rgba(11, 15, 14, 0.92)', borderBottomWidth: 1, borderBottomColor: Colors.border },
  headingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  headingCopy: { flex: 1 },
  title: { color: Colors.textPrimary, fontSize: Typography.sizes.xl, lineHeight: 25, fontWeight: Typography.weights.bold, letterSpacing: -0.4 },
  subtitle: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, marginTop: 2 },
  territoryCount: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 6 },
  countText: { color: Colors.textPrimary, fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, fontVariant: ['tabular-nums'] },
  searchInput: { minHeight: 44, backgroundColor: Colors.surface },
  filters: { gap: Spacing.xs, paddingTop: Spacing.md },
  filterChip: { minHeight: 34, justifyContent: 'center', paddingHorizontal: Spacing.md, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  filterChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  filterText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, fontWeight: Typography.weights.medium },
  filterTextActive: { color: Colors.primary, fontWeight: Typography.weights.bold },
  mapLegend: { position: 'absolute', left: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: 'rgba(20, 27, 24, 0.94)', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 3 },
  legendText: { color: Colors.textSecondary, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 0.5 },
  mapActions: { position: 'absolute', right: Spacing.lg, alignItems: 'flex-end', gap: Spacing.xs },
  locationButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  locationButtonPressed: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  centerMessage: { color: Colors.textPrimary, backgroundColor: Colors.surface, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.sm, overflow: 'hidden', fontSize: 11 },
  noResults: { position: 'absolute', alignSelf: 'center', top: '52%', alignItems: 'center', padding: Spacing.lg, borderRadius: Radius.lg, backgroundColor: 'rgba(20, 27, 24, 0.94)', borderWidth: 1, borderColor: Colors.border },
  noResultsTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  noResultsText: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, marginTop: 3 },
  sheetContent: { gap: Spacing.lg },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  ownerCopy: { flex: 1 },
  ownerLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 0.8 },
  ownerName: { color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, marginTop: 2 },
  ownerLevel: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, marginTop: 2 },
  statusPill: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 6 },
  statusText: { fontSize: 11, fontWeight: Typography.weights.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailRow: { flexDirection: 'row', gap: Spacing.sm },
  detailCard: { flex: 1, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.surfaceElevated },
  detailValue: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold },
  detailLabel: { color: Colors.textSecondary, fontSize: 11, fontWeight: Typography.weights.bold, letterSpacing: 0.6, marginTop: 4 },
  profileButton: { minHeight: 48 },
});
