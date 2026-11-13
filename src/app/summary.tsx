import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Award, Footprints, MapPin, Timer } from 'lucide-react-native';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Icon } from '../components/common/Icon';
import { ThemedText } from '../components/common/ThemedText';
import { RunMapView } from '../components/map/RunMapView';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import { useRunSubmission } from '../hooks/useRunSubmission';
import { rejectReasonMessage } from '../services/runs';
import { useRunStore } from '../stores/useRunStore';
import { formatArea } from '../utils/formatters';
import { formatDuration, formatPace } from './run';

export default function RunSummaryScreen() {
  const insets = useSafeAreaInsets();
  const session = useRunStore((state) => state.currentSession);
  const startRun = useRunStore((state) => state.startRun);
  const { submission, retry } = useRunSubmission();

  useEffect(() => {
    if (!session || session.status !== 'finished') router.replace('/');
  }, [session]);

  if (!session) return <View style={styles.screen} />;

  // Once the server has scored the run, its numbers are the ones that count.
  const result = submission.state === 'saved' ? submission.result : null;
  const rejected = result?.status === 'rejected';
  const distanceMeters = result?.distanceMeters ?? session.distanceMeters;
  const durationSeconds = result?.durationSeconds ?? session.durationSeconds;
  const cellCount = result ? result.cells.length : session.territoriesClaimedCount;
  const areaKm2 = result ? result.areaKm2 : session.territoryCapturedKm2;
  const xp = result ? result.xpEarned : session.xpEarned;
  const saving = submission.state === 'saving' || submission.state === 'idle';
  const averagePace = distanceMeters > 0
    ? durationSeconds / (distanceMeters / 1000)
    : session.currentPaceSecondsPerKm;

  const heading = rejected
    ? { eyebrow: 'RUN NOT COUNTED', title: 'This one didn’t count.', subtitle: rejectReasonMessage(result.rejectReason) }
    : submission.state === 'failed'
      ? { eyebrow: 'NOT SAVED YET', title: 'Your run isn’t saved.', subtitle: submission.error }
      : saving
        ? { eyebrow: 'SAVING RUN', title: 'Claiming your territory…', subtitle: 'Checking your route with the server.' }
        : { eyebrow: 'RUN COMPLETE', title: 'Nice work out there.', subtitle: result?.runId ? 'Your territory is on the map.' : 'Offline demo: this run wasn’t saved.' };

  const breakdown = result && !rejected && result.runId
    ? [
        result.cellsNew ? `${result.cellsNew} new` : null,
        result.cellsStolen ? `${result.cellsStolen} stolen` : null,
        result.cellsDefended ? `${result.cellsDefended} defended` : null,
      ].filter(Boolean).join(' · ')
    : '';

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }]}
      >
        <View style={styles.headingRow}>
          <View style={[styles.successMark, (rejected || submission.state === 'failed') && styles.warningMark]}>
            {saving ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <Icon icon={Award} size={22} color={rejected || submission.state === 'failed' ? Colors.danger : Colors.primary} strokeWidth={2.3} />
            )}
          </View>
          <View style={styles.headingCopy}>
            <ThemedText style={[styles.eyebrow, (rejected || submission.state === 'failed') && styles.warningText]}>{heading.eyebrow}</ThemedText>
            <ThemedText style={styles.title}>{heading.title}</ThemedText>
            <ThemedText style={styles.subtitle}>{heading.subtitle}</ThemedText>
          </View>
        </View>

        <View style={styles.mapCard}>
          <RunMapView route={session.route} capturedCells={result ? result.cells : session.capturedCells} />
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
            value={`${(distanceMeters / 1000).toFixed(2)}`}
            unit="KM"
            accent
          />
          <SummaryStat
            icon={Timer}
            label="DURATION"
            value={formatDuration(durationSeconds)}
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
            value={saving ? '…' : `${xp}`}
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
            <ThemedText style={styles.territoryName}>
              {cellCount} hex {cellCount === 1 ? 'cell' : 'cells'}
            </ThemedText>
            {breakdown ? <ThemedText style={styles.territoryBreakdown}>{breakdown}</ThemedText> : null}
          </View>
          <ThemedText style={styles.territoryArea}>+{formatArea(areaKm2)}</ThemedText>
        </Card>

        {submission.state === 'failed' ? (
          <Button title="TRY SAVING AGAIN" variant="secondary" size="lg" fullWidth onPress={retry} />
        ) : null}

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
          disabled={saving}
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
  warningMark: {
    backgroundColor: Colors.dangerMuted,
    borderColor: Colors.danger,
  },
  warningText: {
    color: Colors.danger,
  },
  territoryBreakdown: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
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
