import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../constants/theme';

export function PartyPage({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const insets = useSafeAreaInsets();
  const contentStyle = [styles.content, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }];
  return (
    <View style={styles.screen}>
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={contentStyle}>
          {children}
        </ScrollView>
      ) : (
        <View style={contentStyle}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, paddingHorizontal: Spacing.lg },
});
