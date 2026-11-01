import React from 'react';
import {
  Modal as RNModal,
  View,
  StyleSheet,
  Pressable,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
  ViewStyle,
  StyleProp,
  DimensionValue,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { ThemedText } from './ThemedText';
import { Icon } from './Icon';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: DimensionValue;
  showHandle?: boolean;
  showCloseButton?: boolean;
  dismissOnBackdrop?: boolean;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = '85%',
  showHandle = true,
  showCloseButton = true,
  dismissOnBackdrop = true,
  scrollable = false,
  style,
  contentStyle,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={dismissOnBackdrop ? onClose : undefined}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.sheetContainer,
            {
              maxHeight,
              paddingBottom: Math.max(insets.bottom, Spacing.lg),
            },
            style,
          ]}
        >
          {showHandle ? (
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
          ) : null}

          {(title || showCloseButton) && (
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                {title ? (
                  <ThemedText variant="sectionHeading" style={styles.title}>
                    {title}
                  </ThemedText>
                ) : null}
                {subtitle ? (
                  <ThemedText variant="caption" style={styles.subtitle}>
                    {subtitle}
                  </ThemedText>
                ) : null}
              </View>

              {showCloseButton ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close bottom sheet"
                  onPress={onClose}
                  style={styles.closeButton}
                  hitSlop={8}
                >
                  <Icon icon={X} size={18} color={Colors.textSecondary} strokeWidth={2.2} />
                </Pressable>
              ) : null}
            </View>
          )}

          {scrollable ? (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.scrollContent, contentStyle]}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.staticContent, contentStyle]}>{children}</View>
          )}
        </View>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.overlay,
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 16,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    marginBottom: Spacing.md,
  },
  titleContainer: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
  },
  subtitle: {
    marginTop: Spacing.xs - 2,
    color: Colors.textSecondary,
  },
  closeButton: {
    padding: Spacing.xs,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scrollContent: {
    paddingBottom: Spacing.md,
  },
  staticContent: {
    paddingBottom: Spacing.sm,
  },
});
