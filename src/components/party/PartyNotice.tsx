import React from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { Button } from '../common/Button';
import { ThemedText } from '../common/ThemedText';

/** Shared card for party loading / empty / error / offline states. */
export function PartyNotice({ title, body, loading = false, actionLabel, onAction }: {
  title: string;
  body?: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.card} accessibilityRole={loading ? 'progressbar' : undefined}>
      {loading ? <ActivityIndicator color={Colors.primary} style={styles.spinner} /> : null}
      <ThemedText style={styles.title}>{title}</ThemedText>
      {body ? <ThemedText style={styles.body}>{body}</ThemedText> : null}
      {actionLabel && onAction ? <Button title={actionLabel} variant="secondary" size="sm" onPress={onAction} style={styles.action} /> : null}
    </View>
  );
}

export const PartyOfflineNotice = () => (
  <PartyNotice title="Sign in to play with others" body="Parties run online with real runners." />
);

/** What to show while the active party can't be rendered: offline, error, loading or gone. */
export function PartyLoadState({ offline, query }: { offline: boolean; query: UseQueryResult<unknown> }) {
  if (offline) return <PartyOfflineNotice />;
  if (query.isError) {
    return <PartyNotice title="Couldn’t load this party" body={query.error.message} actionLabel="TRY AGAIN" onAction={() => void query.refetch()} />;
  }
  if (query.isPending) return <PartyNotice loading title="Loading party…" />;
  return <PartyNotice title="Party not found" body="It may have been closed by the host." actionLabel="BACK TO PARTIES" onAction={() => router.replace('/parties')} />;
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', padding: Spacing.xl, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  spinner: { marginBottom: Spacing.sm },
  title: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, textAlign: 'center' },
  body: { color: Colors.textSecondary, fontSize: Typography.sizes.xs, lineHeight: 18, textAlign: 'center', marginTop: Spacing.xs },
  action: { marginTop: Spacing.md },
});
