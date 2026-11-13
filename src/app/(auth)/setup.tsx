import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AuthScaffold } from '../../components/auth/AuthScaffold';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ThemedText } from '../../components/common/ThemedText';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import {
  PLACEHOLDER_USERNAME,
  TERRITORY_COLORS,
  USERNAME_RULE,
  authErrorMessage,
  signOut,
  updateProfile,
} from '../../services/auth';
import { useAuthStore } from '../../stores/useAuthStore';

export default function ProfileSetupScreen() {
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const setProfile = useAuthStore((state) => state.setProfile);

  const [username, setUsername] = useState(
    profile && !PLACEHOLDER_USERNAME.test(profile.username) ? profile.username : '',
  );
  const [color, setColor] = useState<string>(profile?.color ?? TERRITORY_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const usernameError =
    username.length > 0 && !USERNAME_RULE.test(username) ? '3–20 letters, numbers or underscores.' : undefined;
  const canSubmit = USERNAME_RULE.test(username) && !submitting && Boolean(session);

  const submit = async () => {
    if (!session) return;
    setSubmitting(true);
    setError(null);
    try {
      // Setting the profile flips auth status to signed-in; the guard then opens the app.
      setProfile(await updateProfile(session.user.id, { username, color }));
    } catch (reason) {
      setError(authErrorMessage(reason));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScaffold
      title="Set up your runner"
      subtitle="This is how other players see you on the map."
      error={error}
      footer={<Button title="USE A DIFFERENT ACCOUNT" variant="ghost" onPress={() => void signOut()} />}
    >
      <Input
        label="Runner name"
        value={username}
        onChangeText={setUsername}
        error={usernameError}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
        placeholder="e.g. NightStrider"
      />

      <View>
        <ThemedText style={styles.label}>Territory colour</ThemedText>
        <View style={styles.swatches} accessibilityRole="radiogroup">
          {TERRITORY_COLORS.map((swatch) => {
            const selected = swatch === color;
            return (
              <Pressable
                key={swatch}
                onPress={() => setColor(swatch)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Colour ${swatch}`}
                hitSlop={6}
                style={[styles.swatchRing, selected && { borderColor: swatch }]}
              >
                <View style={[styles.swatch, { backgroundColor: swatch }]} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button title="START PLAYING" size="lg" fullWidth loading={submitting} disabled={!canSubmit} onPress={submit} />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  label: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
  },
  swatches: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  swatchRing: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: { width: 32, height: 32, borderRadius: Radius.full },
});
