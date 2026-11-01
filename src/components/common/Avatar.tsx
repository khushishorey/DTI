import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { User } from 'lucide-react-native';
import { Colors, Radius, Typography } from '../../constants/theme';
import { ThemedText } from './ThemedText';
import { Icon } from './Icon';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'running' | 'offline';

export interface AvatarProps {
  source?: string | ImageSource | null;
  name?: string;
  size?: AvatarSize | number;
  status?: AvatarStatus;
  borderColor?: string;
  borderWidth?: number;
  style?: StyleProp<ViewStyle>;
}

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 52,
  xl: 72,
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  status,
  borderColor,
  borderWidth = 2,
  style,
}) => {
  const [hasError, setHasError] = useState(false);

  const dimension = typeof size === 'number' ? size : SIZE_MAP[size];
  const borderRadius = dimension / 2;

  const initials = getInitials(name);
  const statusSize = Math.max(8, Math.round(dimension * 0.26));

  const showImage = Boolean(source) && !hasError;

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius,
        },
        Boolean(borderColor) && {
          borderWidth,
          borderColor,
        },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={source!}
          style={[styles.image, { width: dimension, height: dimension, borderRadius }]}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
          onError={() => setHasError(true)}
        />
      ) : initials ? (
        <View
          style={[
            styles.fallbackContainer,
            { width: dimension, height: dimension, borderRadius },
          ]}
        >
          <ThemedText
            style={[
              styles.initialsText,
              {
                fontSize: Math.round(dimension * 0.38),
              },
            ]}
          >
            {initials}
          </ThemedText>
        </View>
      ) : (
        <View
          style={[
            styles.fallbackContainer,
            { width: dimension, height: dimension, borderRadius },
          ]}
        >
          <Icon
            icon={User}
            size={Math.round(dimension * 0.55)}
            color={Colors.textSecondary}
            strokeWidth={2}
          />
        </View>
      )}

      {status ? (
        <View
          style={[
            styles.statusDot,
            styles[`status_${status}`],
            {
              width: statusSize,
              height: statusSize,
              borderRadius: statusSize / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      ) : null}
    </View>
  );
};

function getInitials(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  image: {
    backgroundColor: Colors.surfaceElevated,
  },
  fallbackContainer: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: Colors.primary,
    fontWeight: Typography.weights.bold,
  },
  statusDot: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  status_online: {
    backgroundColor: Colors.secondary,
  },
  status_running: {
    backgroundColor: Colors.primary,
  },
  status_offline: {
    backgroundColor: Colors.textMuted,
  },
});
