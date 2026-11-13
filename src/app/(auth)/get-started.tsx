import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AuthScaffold } from '../../components/auth/AuthScaffold';
import { Button } from '../../components/common/Button';
import { ThemedText } from '../../components/common/ThemedText';
import { Colors, Spacing, Typography } from '../../constants/theme';

const PILLARS = [
  ['Move', 'Every run is tracked on a live map.'],
  ['Capture', 'Run through hex cells to claim them.'],
  ['Compete', 'Steal rivals’ ground and climb the board.'],
] as const;

export default function GetStartedScreen() {
  return (
    <AuthScaffold
      title="Claim your city, one run at a time."
      subtitle="run.io turns your runs into territory."
      footer={
        <View style={styles.actions}>
          <Button title="CREATE ACCOUNT" size="lg" fullWidth onPress={() => router.push('/register')} />
          <Button title="I ALREADY HAVE AN ACCOUNT" variant="ghost" size="md" fullWidth onPress={() => router.push('/login')} />
        </View>
      }
    >
      {PILLARS.map(([name, copy]) => (
        <View key={name} style={styles.pillar}>
          <View style={styles.dot} />
          <View style={styles.pillarCopy}>
            <ThemedText style={styles.pillarName}>{name}</ThemedText>
            <ThemedText style={styles.pillarText}>{copy}</ThemedText>
          </View>
        </View>
      ))}
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  actions: { width: '100%', gap: Spacing.sm },
  pillar: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, marginTop: 6 },
  pillarCopy: { flex: 1 },
  pillarName: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold },
  pillarText: { color: Colors.textSecondary, fontSize: Typography.sizes.sm, marginTop: 2 },
});
