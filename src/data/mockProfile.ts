import { UserProfile } from '../types/user';
import { Colors } from '../constants/theme';

export interface PlayerAchievement {
  id: string;
  name: string;
  description: string;
  icon: 'footprints' | 'territory' | 'trophy' | 'streak' | 'party' | 'distance';
  unlocked: boolean;
  progress?: string;
}

export interface RecentRunActivity {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  distanceKm: number;
  territoryKm2: number;
  color: string;
}

export const MOCK_PROFILE: UserProfile = {
  id: 'player-me',
  username: 'RunnerOne',
  email: 'runner.one@example.com',
  avatarUrl: '',
  level: 24,
  totalDistanceKm: 286.4,
  totalTerritoryCapturedKm2: 1.842,
  totalRunsCount: 82,
  winsCount: 14,
  joinedDate: '2025-02-12T00:00:00Z',
};

export const MOCK_ACHIEVEMENTS: PlayerAchievement[] = [
  { id: 'first-stride', name: 'First Stride', description: 'Complete your first run.', icon: 'footprints', unlocked: true },
  { id: 'groundbreaker', name: 'Groundbreaker', description: 'Capture 1 km² of territory.', icon: 'territory', unlocked: true },
  { id: 'podium-finisher', name: 'Podium Finisher', description: 'Win 10 competitions.', icon: 'trophy', unlocked: true },
  { id: 'week-streak', name: 'Seven Day Streak', description: 'Run seven days in a row.', icon: 'streak', unlocked: true },
  { id: 'crew-captain', name: 'Crew Captain', description: 'Win 20 party challenges.', icon: 'party', unlocked: false, progress: '14 / 20' },
  { id: 'ultra-runner', name: 'Ultra Runner', description: 'Reach 500 km total distance.', icon: 'distance', unlocked: false, progress: '286 / 500 km' },
];

export const MOCK_RECENT_ACTIVITIES: RecentRunActivity[] = [
  { id: 'activity-1', title: 'Presidio morning loop', subtitle: 'Territory Control · 28 min', date: 'Today · 7:42 AM', distanceKm: 5.2, territoryKm2: 0.038, color: Colors.primary },
  { id: 'activity-2', title: 'Sunset Striders', subtitle: 'Party win · 1st place', date: 'Yesterday · 6:18 PM', distanceKm: 4.6, territoryKm2: 0.052, color: Colors.competitorOrange },
  { id: 'activity-3', title: 'Pacific Heights circuit', subtitle: 'Solo run · New personal best', date: 'Oct 30 · 8:05 AM', distanceKm: 6.8, territoryKm2: 0.061, color: Colors.competitorBlue },
  { id: 'activity-4', title: 'Marina greenway', subtitle: 'Distance Race · 3rd place', date: 'Oct 28 · 5:34 PM', distanceKm: 3.9, territoryKm2: 0.024, color: Colors.competitorPurple },
];
