import { Colors } from '../constants/theme';
import { Party } from '../types/party';

export const CURRENT_PLAYER_ID = 'player-me';

export const CURRENT_PARTICIPANT = {
  id: CURRENT_PLAYER_ID,
  username: 'RunnerOne',
  avatarUrl: '',
  isHost: false,
  score: 1840,
  territoryCapturedKm2: 0.142,
  distanceCoveredKm: 3.8,
  color: Colors.primary,
};

export const MOCK_PARTIES: Party[] = [
  {
    id: 'party-sunset',
    name: 'Sunset Striders',
    code: 'SUNSET',
    visibility: 'public',
    gameMode: 'territory_control',
    durationMinutes: 30,
    maxParticipants: 8,
    status: 'lobby',
    hostId: 'player-ghost',
    participants: [
      { id: 'player-ghost', username: 'GhostStride', avatarUrl: '', isHost: true, score: 2450, territoryCapturedKm2: 0.215, distanceCoveredKm: 6.4, color: Colors.competitorOrange },
      { id: 'player-nova', username: 'NovaPace', avatarUrl: '', isHost: false, score: 2180, territoryCapturedKm2: 0.186, distanceCoveredKm: 5.2, color: Colors.competitorBlue },
      { id: CURRENT_PLAYER_ID, username: 'RunnerOne', avatarUrl: '', isHost: false, score: 1840, territoryCapturedKm2: 0.142, distanceCoveredKm: 3.8, color: Colors.primary },
      { id: 'player-moss', username: 'MossRunner', avatarUrl: '', isHost: false, score: 1520, territoryCapturedKm2: 0.098, distanceCoveredKm: 4.1, color: Colors.competitorPurple },
    ],
    createdAt: '2026-10-31T16:20:00Z',
  },
  {
    id: 'party-bay-loop',
    name: 'Bay Loop Dash',
    code: 'BAYRUN',
    visibility: 'public',
    gameMode: 'distance_race',
    durationMinutes: 20,
    maxParticipants: 12,
    status: 'in_progress',
    hostId: 'player-nova',
    participants: [
      { id: 'player-nova', username: 'NovaPace', avatarUrl: '', isHost: true, score: 2820, territoryCapturedKm2: 0.12, distanceCoveredKm: 4.6, color: Colors.competitorBlue },
      { id: 'player-ghost', username: 'GhostStride', avatarUrl: '', isHost: false, score: 2670, territoryCapturedKm2: 0.11, distanceCoveredKm: 4.2, color: Colors.competitorOrange },
      { id: 'player-moss', username: 'MossRunner', avatarUrl: '', isHost: false, score: 2310, territoryCapturedKm2: 0.09, distanceCoveredKm: 3.7, color: Colors.competitorPurple },
    ],
    createdAt: '2026-11-01T06:30:00Z',
    startedAt: Date.now() - 6 * 60 * 1000,
    endsAt: Date.now() + 14 * 60 * 1000,
  },
  {
    id: 'party-hill',
    name: 'Twin Peaks Takeover',
    code: 'PEAK24',
    visibility: 'public',
    gameMode: 'king_of_the_hill',
    durationMinutes: 120,
    maxParticipants: 16,
    status: 'lobby',
    hostId: 'player-moss',
    participants: [
      { id: 'player-moss', username: 'MossRunner', avatarUrl: '', isHost: true, score: 1520, territoryCapturedKm2: 0.098, distanceCoveredKm: 4.1, color: Colors.competitorPurple },
      { id: 'player-ghost', username: 'GhostStride', avatarUrl: '', isHost: false, score: 2450, territoryCapturedKm2: 0.215, distanceCoveredKm: 6.4, color: Colors.competitorOrange },
    ],
    createdAt: '2026-11-01T08:10:00Z',
  },
];
