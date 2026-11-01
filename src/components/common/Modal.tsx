import React from 'react';
import {
  Modal as RNModal,
  View,
  StyleSheet,
  Pressable,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { ThemedText } from './ThemedText';
import { Button, ButtonVariant } from './Button';
import { Icon } from './Icon';

export interface ModalAction {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
}

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  showCloseButton?: boolean;
  dismissOnBackdrop?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
  showCloseButton = true,
  dismissOnBackdrop = true,
  style,
}) => {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={dismissOnBackdrop ? onClose : undefined}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.dialog, style]}>
                {/* Header */}
                {(title || showCloseButton) && (
                  <View style={styles.header}>
                    <View style={styles.titleContainer}>
                      {title ? (
                        <ThemedText variant="cardHeading" style={styles.title}>
                          {title}
                        </ThemedText>
                      ) : null}
                      {description ? (
                        <ThemedText variant="caption" style={styles.description}>
                          {description}
                        </ThemedText>
                      ) : null}
                    </View>

                    {showCloseButton ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Close dialog"
                        onPress={onClose}
                        style={styles.closeButton}
                        hitSlop={8}
                      >
                        <Icon icon={X} size={20} color={Colors.textSecondary} strokeWidth={2.2} />
                      </Pressable>
                    ) : null}
                  </View>
                )}

                {/* Body Content */}
                {children ? <View style={styles.content}>{children}</View> : null}

                {/* Actions Footer */}
                {(primaryAction || secondaryAction) && (
                  <View style={styles.footer}>
                    {secondaryAction ? (
                      <Button
                        title={secondaryAction.label}
                        variant={secondaryAction.variant || 'ghost'}
                        onPress={secondaryAction.onPress}
                        disabled={secondaryAction.disabled}
                        loading={secondaryAction.loading}
                        style={styles.actionButton}
                      />
                    ) : null}

                    {primaryAction ? (
                      <Button
                        title={primaryAction.label}
                        variant={primaryAction.variant || 'primary'}
                        onPress={primaryAction.onPress}
                        disabled={primaryAction.disabled}
                        loading={primaryAction.loading}
                        style={styles.actionButton}
                      />
                    ) : null}
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  titleContainer: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  description: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
  },
  closeButton: {
    padding: Spacing.xs,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: {
    marginVertical: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  actionButton: {
    minWidth: 100,
  },
});
