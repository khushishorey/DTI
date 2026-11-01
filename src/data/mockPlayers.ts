import { NearbyCompetitor } from '../types/user';
import { Colors } from '../constants/theme';

// Simulated players clustered around the demo territory in San Francisco.
export const MOCK_NEARBY_PLAYERS: NearbyCompetitor[] = [
  {
    id: 'player-ghost',
    username: 'GhostStride',
    avatarUrl: '',
    location: { latitude: 37.78715, longitude: -122.4352 },
    territoryColor: Colors.competitorOrange,
    level: 18,
    distanceFromUserMeters: 240,
    isOnline: true,
  },
  {
    id: 'player-nova',
    username: 'NovaPace',
    avatarUrl: '',
    location: { latitude: 37.79015, longitude: -122.4296 },
    territoryColor: Colors.competitorBlue,
    level: 12,
    distanceFromUserMeters: 510,
    isOnline: true,
  },
  {
    id: 'player-moss',
    username: 'MossRunner',
    avatarUrl: '',
    location: { latitude: 37.7839, longitude: -122.4288 },
    territoryColor: Colors.competitorPurple,
    level: 9,
    distanceFromUserMeters: 780,
    isOnline: false,
  },
];
