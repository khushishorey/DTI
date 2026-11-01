import React, { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { LockKeyhole, Map, Mountain, Timer, UnlockKeyhole, Users } from 'lucide-react-native';
import { PartyPage } from '../../components/party/PartyPage';
import { PartyScreenHeader } from '../../components/party/PartyScreenHeader';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import { Input } from '../../components/common/Input';
import { ThemedText } from '../../components/common/ThemedText';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { usePartyStore } from '../../stores/usePartyStore';
import { PartyGameMode, PartyVisibility } from '../../types/party';

const PRESET_DURATIONS = [10, 20, 30, 60, 120, 1440];
const GAME_MODES: { value: PartyGameMode; label: string; description: string; icon: typeof Map }[] = [
  { value: 'territory_control', label: 'Territory Control', description: 'Capture the most ground.', icon: Map },
  { value: 'distance_race', label: 'Distance Race', description: 'Cover the most distance.', icon: Timer },
  { value: 'king_of_the_hill', label: 'King of the Hill', description: 'Hold the central zone.', icon: Mountain },
];

export default function CreatePartyScreen() {
  const createParty = usePartyStore((state) => state.createParty);
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<PartyVisibility>('public');
  const [gameMode, setGameMode] = useState<PartyGameMode>('territory_control');
  const [duration, setDuration] = useState(30);
  const [customDuration, setCustomDuration] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(8);
  const customValue = Number.parseInt(customDuration, 10);
  const hasCustomDuration = customDuration.trim().length > 0;
  const selectedDuration = hasCustomDuration ? customValue : duration;
  const customIsValid = !hasCustomDuration || (Number.isInteger(customValue) && customValue >= 5 && customValue <= 10080);
  const canCreate = name.trim().length >= 3 && customIsValid && selectedDuration > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    const party = createParty({ name, visibility, gameMode, durationMinutes: selectedDuration, maxParticipants });
    router.replace('/parties/lobby');
    return party;
  };

  return (
    <PartyPage>
      <PartyScreenHeader title="Create a party" subtitle="Set the rules, then bring your crew." backTo="/parties" />

      <Input
        label="Party name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Friday Night Runners"
        maxLength={32}
        returnKeyType="done"
        hint={`${name.length}/32 characters · At least 3 characters`}
      />

      <SectionTitle title="Who can join?" subtitle="You can change this before the run starts." />
      <View style={styles.visibilityRow}>
        <VisibilityOption
          selected={visibility === 'public'}
          title="Public"
          subtitle="Anyone nearby"
          icon={UnlockKeyhole}
          onPress={() => setVisibility('public')}
        />
        <VisibilityOption
          selected={visibility === 'private'}
          title="Private"
          subtitle="Invite code only"
          icon={LockKeyhole}
          onPress={() => setVisibility('private')}
        />
      </View>

      <SectionTitle title="Choose a game mode" />
      <View style={styles.modeList}>
        {GAME_MODES.map((mode) => {
          const selected = gameMode === mode.value;
          return (
            <Pressable key={mode.value} onPress={() => setGameMode(mode.value)} style={[styles.modeOption, selected && styles.modeOptionSelected]}>
              <View style={[styles.modeIcon, selected && styles.modeIconSelected]}>
                <Icon icon={mode.icon} size={18} color={selected ? Colors.primary : Colors.textSecondary} strokeWidth={2.1} />
              </View>
              <View style={styles.modeCopy}>
                <ThemedText style={[styles.modeName, selected && styles.selectedText]}>{mode.label}</ThemedText>
                <ThemedText style={styles.modeDescription}>{mode.description}</ThemedText>
              </View>
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle title="Competition duration" subtitle="Pick a preset or set a custom time." />
      <View style={styles.durationGrid}>
        {PRESET_DURATIONS.map((minutes) => {
          const selected = !hasCustomDuration && duration === minutes;
          return (
            <Pressable
              key={minutes}
              onPress={() => { setDuration(minutes); setCustomDuration(''); }}
              style={[styles.durationChip, selected && styles.durationChipSelected]}
            >
              <ThemedText style={[styles.durationText, selected && styles.selectedText]}>{durationLabel(minutes)}</ThemedText>
            </Pressable>
          );
        })}
      </View>
      <Input
        label="Custom duration (minutes)"
        value={customDuration}
        onChangeText={(value) => setCustomDuration(value.replace(/\D/g, '').slice(0, 5))}
        placeholder="For example, 45"
        keyboardType="number-pad"
        error={hasCustomDuration && !customIsValid ? 'Enter a duration from 5 minutes to 7 days.' : undefined}
        hint={!hasCustomDuration ? 'Optional · 5 to 10,080 minutes' : undefined}
      />

      <SectionTitle title="Maximum players" subtitle="Including you as the party leader." />
      <View style={styles.playerStepper}>
        <View style={styles.playerStepIcon}>
          <Icon icon={Users} size={18} color={Colors.primary} />
        </View>
        <View style={styles.playerStepCopy}>
          <ThemedText style={styles.playerStepTitle}>Party size</ThemedText>
          <ThemedText style={styles.playerStepSubtitle}>2–32 players</ThemedText>
        </View>
        <Pressable onPress={() => setMaxParticipants((value) => Math.max(2, value - 1))} style={styles.stepButton} accessibilityLabel="Decrease maximum players">
          <ThemedText style={styles.stepButtonText}>−</ThemedText>
        </Pressable>
        <ThemedText style={styles.playerCount}>{maxParticipants}</ThemedText>
        <Pressable onPress={() => setMaxParticipants((value) => Math.min(32, value + 1))} style={styles.stepButton} accessibilityLabel="Increase maximum players">
          <ThemedText style={styles.stepButtonText}>+</ThemedText>
        </Pressable>
      </View>

      <Button title="CREATE PARTY" size="lg" fullWidth disabled={!canCreate} onPress={handleCreate} style={styles.createButton} />
    </PartyPage>
  );
}

function durationLabel(minutes: number) {
  if (minutes === 1440) return '24 hours';
  if (minutes >= 60) return `${minutes / 60} hr`;
  return `${minutes} min`;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <ThemedText style={styles.sectionHeading}>{title}</ThemedText>
      {subtitle ? <ThemedText style={styles.sectionSubtitle}>{subtitle}</ThemedText> : null}
    </View>
  );
}

function VisibilityOption({ selected, title, subtitle, icon, onPress }: {
  selected: boolean;
  title: string;
  subtitle: string;
  icon: typeof LockKeyhole;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.visibilityOption, selected && styles.visibilitySelected]}>
      <Icon icon={icon} size={17} color={selected ? Colors.primary : Colors.textSecondary} />
      <ThemedText style={[styles.visibilityTitle, selected && styles.selectedText]}>{title}</ThemedText>
      <ThemedText style={styles.visibilitySubtitle}>{subtitle}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { marginTop: Spacing.xl, marginBottom: Spacing.sm },
  sectionHeading: { color: Colors.textPrimary, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  sectionSubtitle: { color: Colors.textSecondary, fontSize: 10, marginTop: 3 },
  visibilityRow: { flexDirection: 'row', gap: Spacing.sm },
  visibilityOption: { flex: 1, padding: Spacing.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg },
  visibilitySelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  visibilityTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, marginTop: Spacing.sm },
  visibilitySubtitle: { color: Colors.textSecondary, fontSize: 9, marginTop: 2 },
  selectedText: { color: Colors.primary },
  modeList: { gap: Spacing.xs },
  modeOption: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg },
  modeOptionSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(183, 243, 74, 0.07)' },
  modeIcon: { width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  modeIconSelected: { backgroundColor: Colors.primaryMuted },
  modeCopy: { flex: 1 },
  modeName: { color: Colors.textPrimary, fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  modeDescription: { color: Colors.textSecondary, fontSize: 10, marginTop: 2 },
  radio: { width: 18, height: 18, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.textMuted, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: Colors.primary },
  radioDot: { width: 8, height: 8, borderRadius: Radius.full, backgroundColor: Colors.primary },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md },
  durationChip: { minWidth: '31%', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm + 2, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md },
  durationChipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  durationText: { color: Colors.textSecondary, fontSize: 10, fontWeight: Typography.weights.semibold },
  playerStepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md },
  playerStepIcon: { width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  playerStepCopy: { flex: 1 },
  playerStepTitle: { color: Colors.textPrimary, fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  playerStepSubtitle: { color: Colors.textSecondary, fontSize: 9, marginTop: 2 },
  stepButton: { width: 32, height: 32, borderRadius: Radius.sm, backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  stepButtonText: { color: Colors.textPrimary, fontSize: 20, lineHeight: 24, fontWeight: Typography.weights.medium },
  playerCount: { width: 34, textAlign: 'center', color: Colors.textPrimary, fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, fontVariant: ['tabular-nums'] },
  createButton: { marginTop: Spacing.xl },
});
