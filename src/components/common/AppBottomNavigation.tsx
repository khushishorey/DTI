import React from 'react';
import { router } from 'expo-router';
import { BottomNavBar, NavTabKey } from './BottomNavBar';

export function AppBottomNavigation({ activeTab }: { activeTab: NavTabKey }) {
  const navigate = (tab: NavTabKey) => {
    if (tab === 'home') router.replace('/');
    else if (tab === 'explore') router.replace('/explore');
    else if (tab === 'parties') router.replace('/parties');
    else if (tab === 'leaderboard') router.replace('/leaderboard');
    else router.replace('/profile');
  };

  return (
    <BottomNavBar
      activeTab={activeTab}
      onTabPress={navigate}
      badges={{ parties: 1 }}
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
    />
  );
}
