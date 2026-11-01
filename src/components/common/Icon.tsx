import React from 'react';
import { LucideIcon, LucideProps } from 'lucide-react-native';
import { Colors, IconSizes, IconSizeToken } from '../../constants/theme';

export interface IconProps extends Omit<LucideProps, 'size' | 'stroke' | 'strokeWidth'> {
  icon: LucideIcon;
  size?: IconSizeToken | number;
  color?: string;
  strokeWidth?: number;
}

export const Icon: React.FC<IconProps> = ({
  icon: IconComponent,
  size = 'md',
  color = Colors.textPrimary,
  strokeWidth = 2,
  ...props
}) => {
  const resolvedSize = typeof size === 'number' ? size : IconSizes[size];
  // lucide-react-native forwards SVG props, but its types omit `stroke` when
  // react-native-svg (a peer dependency) is not present in the type resolver.
  const TypedIcon = IconComponent as React.ComponentType<
    LucideProps & { stroke?: string; strokeWidth?: number }
  >;

  return (
    <TypedIcon
      size={resolvedSize}
      stroke={color}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
};
