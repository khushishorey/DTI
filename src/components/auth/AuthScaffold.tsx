import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Zap } from 'lucide-react-native';
import { Icon } from '../common/Icon';
import { ThemedText } from '../common/ThemedText';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';

interface AuthScaffoldProps {
  title: string;
  subtitle?: string;
  error?: string | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Shared frame for the welcome, log-in, sign-up and profile-setup screens. */
export function AuthScaffold({ title, subtitle, error, children, footer }: AuthScaffoldProps) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.huge, paddingBottom: insets.bottom + Spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Icon icon={Zap} size={22} color={Colors.textInverse} strokeWidth={2.6} />
          </View>
          <ThemedText style={styles.brand}>run.io</ThemedText>
        </View>

        <ThemedText style={styles.title}>{title}</ThemedText>
        {subtitle ? <ThemedText style={styles.subtitle}>{subtitle}</ThemedText> : null}

        {error ? (
          <View style={styles.errorBox} accessibilityRole="alert">
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        ) : null}

        <View style={styles.body}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, paddingHorizontal: Spacing.xl },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.huge },
  logo: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { color: Colors.textPrimary, fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  title: {
    color: Colors.textPrimary,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: Typography.weights.bold,
  },
  subtitle: { color: Colors.textSecondary, fontSize: Typography.sizes.base, marginTop: Spacing.sm },
  errorBox: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.dangerMuted,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorText: { color: Colors.textPrimary, fontSize: Typography.sizes.sm },
  body: { marginTop: Spacing.xxl, gap: Spacing.lg },
  footer: { marginTop: 'auto', paddingTop: Spacing.xxl, alignItems: 'center' },
});
