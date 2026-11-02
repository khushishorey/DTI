import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Award, Footprints, MapPin, Timer } from 'lucide-react-native';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Icon } from '../components/common/Icon';
import { ThemedText } from '../components/common/ThemedText';
import { RunMapView } from '../components/map/RunMapView';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import { useRunStore } from '../stores/useRunStore';
import { formatDuration, formatPace } from './run';

export default function RunSummaryScreen() {
  const insets = useSafeAreaInsets();
  const session = useRunStore((state) => state.currentSession);
  const startRun = useRunStore((state) => state.startRun);

  useEffect(() => {
    if (!session || session.status !== 'finished') router.replace('/');
  }, [session]);

  if (!session) return <View style={styles.screen} />;

  const averagePace = session.distanceMeters > 0
    ? session.durationSeconds / (session.distanceMeters / 1000)
    : session.currentPaceSecondsPerKm;

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }]}
      >
        <View style={styles.headingRow}>
          <View style={styles.successMark}>
            <Icon icon={Award} size={22} color={Colors.primary} strokeWidth={2.3} />
          </View>
          <View style={styles.headingCopy}>
            <ThemedText style={styles.eyebrow}>RUN COMPLETE</ThemedText>
            <ThemedText style={styles.title}>Nice work out there.</ThemedText>
            <ThemedText style={styles.subtitle}>Every run moves your territory forward.</ThemedText>
          </View>
        </View>

        <View style={styles.mapCard}>
          <RunMapView route={session.route} />
          <View style={styles.routeTag}>
            <View style={styles.routeDot} />
            <ThemedText style={styles.routeTagText}>YOUR ROUTE</ThemedText>
          </View>
          <View style={styles.routeEndTag}>
            <Icon icon={MapPin} size={12} color={Colors.primary} strokeWidth={2.5} />
            <ThemedText style={styles.routeEndText}>FINISH</ThemedText>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <SummaryStat
            icon={Footprints}
            label="DISTANCE"
            value={`${(session.distanceMeters / 1000).toFixed(2)}`}
            unit="KM"
            accent
          />
          <SummaryStat
            icon={Timer}
            label="DURATION"
            value={formatDuration(session.durationSeconds)}
          />
          <SummaryStat
            icon={MapPin}
            label="AVG. PACE"
            value={formatPace(averagePace)}
            unit="/KM"
          />
          <SummaryStat
            icon={Award}
            label="XP EARNED"
            value={`${session.xpEarned}`}
            unit="XP"
            accent
          />
        </View>

        <Card padding="lg" style={styles.territoryCard}>
          <View style={styles.territoryGlyph}>
            <View style={styles.territoryGlyphInner} />
          </View>
          <View style={styles.territoryCopy}>
            <ThemedText style={styles.territoryEyebrow}>TERRITORY CAPTURED</ThemedText>
            <ThemedText style={styles.territoryName}>Sector Alpha</ThemedText>
          </View>
          <ThemedText style={styles.territoryArea}>+{session.territoryCapturedKm2.toFixed(3)} km²</ThemedText>
        </Card>

        <Button
          title="BACK TO MAP"
          size="lg"
          fullWidth
          onPress={() => router.replace('/')}
          style={styles.homeButton}
        />
        <Button
          title="RUN AGAIN"
          variant="ghost"
          size="md"
          fullWidth
          leftIcon={<Icon icon={Footprints} size={16} color={Colors.textSecondary} />}
          onPress={() => {
            startRun();
            router.replace('/run');
          }}
        />
      </ScrollView>
    </View>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  unit,
  accent = false,
}: {
  icon: React.ComponentProps<typeof Icon>['icon'];
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Icon icon={icon} size={15} color={accent ? Colors.primary : Colors.textSecondary} strokeWidth={2.2} />
        <ThemedText style={styles.statLabel}>{label}</ThemedText>
      </View>
      <View style={styles.statValueRow}>
        <ThemedText style={[styles.statValue, accent && styles.accentValue]}>{value}</ThemedText>
        {unit ? <ThemedText style={styles.statUnit}>{unit}</ThemedText> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  successMark: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(183, 243, 74, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingCopy: {
    flex: 1,
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1.4,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xl,
    lineHeight: 26,
    fontWeight: Typography.weights.bold,
    marginTop: 2,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 1,
  },
  mapCard: {
    height: 250,
    overflow: 'hidden',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  routeTag: {
    position: 'absolute',
    left: Spacing.md,
    top: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11, 15, 14, 0.9)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  routeDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  routeTagText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.8,
  },
  routeEndTag: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(11, 15, 14, 0.9)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  routeEndText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.8,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginTop: Spacing.xs,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xl,
    lineHeight: 27,
    fontWeight: Typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },
  accentValue: {
    color: Colors.primary,
  },
  statUnit: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  territoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  territoryGlyph: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  territoryGlyphInner: {
    width: 15,
    height: 15,
    backgroundColor: Colors.primary,
    borderRadius: 4,
    transform: [{ rotate: '45deg' }],
  },
  territoryCopy: {
    flex: 1,
  },
  territoryEyebrow: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.8,
  },
  territoryName: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginTop: 2,
  },
  territoryArea: {
    color: Colors.primary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },
  homeButton: {
    minHeight: 54,
  },
});
