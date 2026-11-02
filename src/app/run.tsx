import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pause, Play, Radio, Square } from 'lucide-react-native';
import { Button } from '../components/common/Button';
import { Icon } from '../components/common/Icon';
import { Modal } from '../components/common/Modal';
import { ThemedText } from '../components/common/ThemedText';
import { RunMapView } from '../components/map/RunMapView';
import { SIMULATED_RUN_ROUTE } from '../data/mockRunRoute';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import { useRunStore } from '../stores/useRunStore';

export default function RunScreen() {
  const insets = useSafeAreaInsets();
  const session = useRunStore((state) => state.currentSession);
  const status = useRunStore((state) => state.status);
  const tick = useRunStore((state) => state.tick);
  const pauseRun = useRunStore((state) => state.pauseRun);
  const resumeRun = useRunStore((state) => state.resumeRun);
  const endRun = useRunStore((state) => state.endRun);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);

  useEffect(() => {
    if (!session) {
      router.replace('/');
      return;
    }
    if (status !== 'running') return;

    const timer = setInterval(() => {
      const elapsed = useRunStore.getState().currentSession?.durationSeconds ?? 0;
      const nextElapsed = elapsed + 1;
      const routePoint = nextElapsed % 5 === 0
        ? SIMULATED_RUN_ROUTE[Math.min(Math.floor(nextElapsed / 5), SIMULATED_RUN_ROUTE.length - 1)]
        : undefined;
      tick(routePoint);
    }, 1000);

    return () => clearInterval(timer);
  }, [session?.id, status, tick]);

  if (!session) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  const isPaused = status === 'paused';

  const finishRun = () => {
    setShowEndConfirmation(false);
    endRun();
    router.replace('/summary');
  };

  return (
    <View style={styles.screen}>
      <RunMapView route={session.route} followCurrentLocation />

      <View style={[styles.topHud, { top: insets.top + Spacing.md }]} pointerEvents="box-none">
        <View style={styles.runStateRow}>
          <View style={styles.liveIndicator}>
            <View style={[styles.liveDot, isPaused && styles.pausedDot]} />
            <ThemedText style={styles.liveText}>{isPaused ? 'PAUSED' : 'RUNNING'}</ThemedText>
          </View>
          <View style={styles.gpsIndicator}>
            <Icon icon={Radio} size={13} color={Colors.primary} strokeWidth={2.2} />
            <ThemedText style={styles.gpsText}>GPS SIMULATION</ThemedText>
          </View>
        </View>

        <View style={styles.timerCard}>
          <ThemedText style={styles.durationLabel}>DURATION</ThemedText>
          <ThemedText style={styles.durationValue}>{formatDuration(session.durationSeconds)}</ThemedText>
        </View>

        <View style={styles.metricsRow}>
          <MetricCard label="DISTANCE" value={`${(session.distanceMeters / 1000).toFixed(2)}`} unit="KM" />
          <MetricCard label="CURRENT PACE" value={session.currentPaceSecondsPerKm ? formatPace(session.currentPaceSecondsPerKm) : '—'} unit="/KM" />
        </View>
      </View>

      <View style={[styles.bottomPanel, { paddingBottom: Math.max(insets.bottom, Spacing.md) + Spacing.sm }]}>
        <View style={styles.captureCard}>
          <View style={styles.captureIconWrap}>
            <View style={styles.captureIcon} />
          </View>
          <View style={styles.captureCopy}>
            <ThemedText style={styles.captureLabel}>TERRITORY IN RANGE</ThemedText>
            <ThemedText style={styles.captureName}>Sector Alpha</ThemedText>
          </View>
          <View style={styles.captureProgressWrap}>
            <ThemedText style={styles.capturePercent}>CAPTURING</ThemedText>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(16 + session.durationSeconds * 0.7, 92)}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.controlsRow}>
          <Button
            title={isPaused ? 'RESUME' : 'PAUSE'}
            variant="secondary"
            size="lg"
            leftIcon={<Icon icon={isPaused ? Play : Pause} size={18} color={Colors.primary} strokeWidth={2.7} />}
            onPress={isPaused ? resumeRun : pauseRun}
            accessibilityHint={isPaused ? 'Resume your simulated run' : 'Pause your simulated run'}
            style={styles.pauseButton}
          />
          <Button
            title="END RUN"
            variant="destructive"
            size="lg"
            leftIcon={<Icon icon={Square} size={15} color={Colors.textPrimary} strokeWidth={2.2} />}
            onPress={() => setShowEndConfirmation(true)}
            style={styles.endButton}
          />
        </View>
        <ThemedText style={styles.runningHint}>KEEP YOUR EYES UP. YOUR RUN IS BEING TRACKED.</ThemedText>
      </View>

      <Modal
        visible={showEndConfirmation}
        onClose={() => setShowEndConfirmation(false)}
        title="End this run?"
        description="Your route and run stats will be saved to the summary."
        dismissOnBackdrop={false}
        primaryAction={{ label: 'End run', variant: 'destructive', onPress: finishRun }}
        secondaryAction={{ label: 'Keep running', onPress: () => setShowEndConfirmation(false) }}
      />
    </View>
  );
}

function MetricCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.metricCard}>
      <ThemedText style={styles.metricLabel}>{label}</ThemedText>
      <View style={styles.metricValueRow}>
        <ThemedText style={styles.metricValue}>{value}</ThemedText>
        <ThemedText style={styles.metricUnit}>{unit}</ThemedText>
      </View>
    </View>
  );
}

export function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatPace(secondsPerKm: number) {
  const roundedSeconds = Math.max(0, Math.round(secondsPerKm));
  const minutes = Math.floor(roundedSeconds / 60);
  const seconds = roundedSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  topHud: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
  },
  runStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: Spacing.md,
    minHeight: 32,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(20, 27, 24, 0.96)',
    borderColor: Colors.border,
    borderWidth: 1,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  pausedDot: {
    backgroundColor: Colors.warning,
  },
  liveText: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
  },
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(20, 27, 24, 0.96)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    minHeight: 32,
  },
  gpsText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.7,
  },
  timerCard: {
    backgroundColor: 'rgba(20, 27, 24, 0.96)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  durationLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1.5,
  },
  durationValue: {
    color: Colors.textPrimary,
    fontSize: 48,
    lineHeight: 56,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(20, 27, 24, 0.96)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  metricLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.8,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginTop: 2,
  },
  metricValue: {
    color: Colors.primary,
    fontSize: 24,
    fontWeight: Typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },
  metricUnit: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: Typography.weights.bold,
  },
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: 'rgba(11, 15, 14, 0.94)',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  captureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  captureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  captureIcon: {
    width: 13,
    height: 13,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    transform: [{ rotate: '45deg' }],
  },
  captureCopy: {
    flex: 1,
  },
  captureLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    letterSpacing: 0.7,
    fontWeight: Typography.weights.bold,
  },
  captureName: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginTop: 2,
  },
  captureProgressWrap: {
    width: 90,
  },
  capturePercent: {
    color: Colors.primary,
    fontSize: 11,
    letterSpacing: 0.5,
    fontWeight: Typography.weights.bold,
    textAlign: 'right',
    marginBottom: 5,
  },
  progressTrack: {
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceHighlight,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pauseButton: {
    flex: 1,
    minHeight: 58,
    backgroundColor: Colors.surfaceElevated,
  },
  endButton: {
    flex: 1,
    minHeight: 58,
  },
  runningHint: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.8,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
