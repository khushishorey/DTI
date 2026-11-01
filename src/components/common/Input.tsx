import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Colors, Radius, Spacing, Typography } from '../../constants/theme';
import { ThemedText } from './ThemedText';
import { Icon } from './Icon';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
}

export const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      clearable = false,
      disabled = false,
      containerStyle,
      inputContainerStyle,
      value,
      onChangeText,
      editable = true,
      onFocus,
      onBlur,
      ...textInputProps
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const isActuallyDisabled = disabled || editable === false;

    const handleClear = () => {
      onChangeText?.('');
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label ? (
          <ThemedText variant="label" style={styles.label}>
            {label}
          </ThemedText>
        ) : null}

        <View
          style={[
            styles.inputContainer,
            isFocused && styles.inputFocused,
            Boolean(error) && styles.inputError,
            isActuallyDisabled && styles.inputDisabled,
            inputContainerStyle,
          ]}
        >
          {leftIcon ? <View style={styles.leftIconContainer}>{leftIcon}</View> : null}

          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            editable={!isActuallyDisabled}
            placeholderTextColor={Colors.textSecondary}
            selectionColor={Colors.primary}
            style={[styles.input, isActuallyDisabled && styles.textDisabled]}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            {...textInputProps}
          />

          {clearable && Boolean(value) && !isActuallyDisabled ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear input"
              onPress={handleClear}
              style={styles.clearButton}
              hitSlop={8}
            >
              <Icon icon={X} size={16} color={Colors.textSecondary} strokeWidth={2.5} />
            </Pressable>
          ) : null}

          {rightIcon ? <View style={styles.rightIconContainer}>{rightIcon}</View> : null}
        </View>

        {error ? (
          <ThemedText variant="caption" style={styles.errorText}>
            {error}
          </ThemedText>
        ) : hint ? (
          <ThemedText variant="caption" style={styles.hintText}>
            {hint}
          </ThemedText>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: Spacing.xs + 2,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.medium,
    fontSize: Typography.sizes.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.md,
    minHeight: 46,
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  inputDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.sizes.base,
    paddingVertical: Spacing.sm,
  },
  textDisabled: {
    color: Colors.textMuted,
  },
  leftIconContainer: {
    marginRight: Spacing.sm,
  },
  rightIconContainer: {
    marginLeft: Spacing.sm,
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  errorText: {
    color: Colors.danger,
    marginTop: Spacing.xs,
    fontSize: Typography.sizes.xs,
  },
  hintText: {
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontSize: Typography.sizes.xs,
  },
});
