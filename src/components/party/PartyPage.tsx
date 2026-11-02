import React from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../constants/theme';

export function PartyPage({
  children,
  scroll = true,
  hasBottomNav = false,
  contentContainerStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  hasBottomNav?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const bottomPadding = hasBottomNav ? insets.bottom + 104 : insets.bottom + Spacing.xl;
  const combinedContentStyle = [
    styles.content,
    { paddingTop: insets.top + Spacing.lg, paddingBottom: bottomPadding },
    contentContainerStyle,
  ];

  return (
    <View style={styles.screen}>
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={combinedContentStyle}>
          {children}
        </ScrollView>
      ) : (
        <View style={combinedContentStyle}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, paddingHorizontal: Spacing.lg },
});
