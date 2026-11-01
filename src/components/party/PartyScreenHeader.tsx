import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { Icon } from '../common/Icon';
import { ThemedText } from '../common/ThemedText';

export function PartyScreenHeader({ title, subtitle, backTo }: { title: string; subtitle?: string; backTo?: Href }) {
  const handleBack = () => backTo ? router.replace(backTo) : router.back();
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={handleBack} style={styles.backButton}>
        <Icon icon={ArrowLeft} size={19} color={Colors.textPrimary} strokeWidth={2.4} />
      </Pressable>
      <View style={styles.copy}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {subtitle ? <ThemedText style={styles.subtitle}>{subtitle}</ThemedText> : null}
      </View>
      <View style={styles.rightSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  rightSpacer: {
    width: 40,
  },
});
