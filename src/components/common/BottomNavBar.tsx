import React from 'react';
import { View, StyleSheet, Pressable, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Compass,
  Users,
  Trophy,
  User,
  LucideIcon,
} from 'lucide-react-native';
import { Colors, IconSizes, Radius, Spacing, Typography } from '../../constants/theme';
import { ThemedText } from './ThemedText';
import { Icon } from './Icon';

export type NavTabKey = 'home' | 'explore' | 'parties' | 'leaderboard' | 'profile';

export interface TabItemConfig {
  key: NavTabKey;
  label: string;
  icon: LucideIcon;
}

export const DEFAULT_NAV_TABS: TabItemConfig[] = [
  { key: 'home', label: 'Home', icon: MapPin },
  { key: 'explore', label: 'Explore', icon: Compass },
  { key: 'parties', label: 'Parties', icon: Users },
  { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { key: 'profile', label: 'Profile', icon: User },
];

export interface BottomNavBarProps {
  activeTab: NavTabKey;
  onTabPress: (tabKey: NavTabKey) => void;
  tabs?: TabItemConfig[];
  badges?: Partial<Record<NavTabKey, number | string | boolean>>;
  style?: StyleProp<ViewStyle>;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabPress,
  tabs = DEFAULT_NAV_TABS,
  badges = {},
  style,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, Spacing.xs),
        },
        style,
      ]}
    >
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const IconComponent = tab.icon;
          const badgeValue = badges[tab.key];
          const hasBadge = badgeValue !== undefined && badgeValue !== false && badgeValue !== 0;

          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} tab`}
              onPress={() => onTabPress(tab.key)}
              style={({ pressed }) => [
                styles.tabItem,
                pressed && styles.tabItemPressed,
              ]}
              hitSlop={4}
            >
              {/* Active glow / indicator indicator */}
              <View style={[styles.indicator, isActive && styles.indicatorActive]} />

              <View style={styles.iconWrapper}>
                <Icon
                  icon={IconComponent}
                  size={IconSizes.md}
                  color={isActive ? Colors.primary : Colors.textSecondary}
                  strokeWidth={isActive ? 2.4 : 2}
                />

                {hasBadge ? (
                  <View style={styles.badgeDot}>
                    {typeof badgeValue === 'number' || typeof badgeValue === 'string' ? (
                      <ThemedText style={styles.badgeText}>
                        {typeof badgeValue === 'number' && badgeValue > 99 ? '99+' : badgeValue}
                      </ThemedText>
                    ) : null}
                  </View>
                ) : null}
              </View>

              <ThemedText
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.xs,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 56,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    position: 'relative',
  },
  tabItemPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
  indicator: {
    position: 'absolute',
    top: -Spacing.xs,
    width: 24,
    height: 3,
    borderRadius: Radius.full,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: Colors.primary,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  badgeDot: {
    position: 'absolute',
    top: -3,
    right: -8,
    minWidth: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: Colors.textInverse,
    fontSize: 9,
    fontWeight: Typography.weights.bold,
    lineHeight: 10,
  },
  tabLabel: {
    fontSize: Typography.sizes.xs - 1,
    fontWeight: Typography.weights.medium,
    marginTop: 2,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: Typography.weights.bold,
  },
  tabLabelInactive: {
    color: Colors.textSecondary,
  },
});
