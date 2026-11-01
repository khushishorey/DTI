import { Colors } from '../constants/theme';
import { MOCK_PARTIES } from './mockParties';
import { LeaderboardEntry } from '../types/user';

export const MOCK_GLOBAL_RANKINGS: LeaderboardEntry[] = [
  entry(1, 'player-peak', 'PeakChaser', 3.842, 312.8, 28460),
  entry(2, 'player-ridge', 'RidgeRunner', 3.416, 287.3, 26720),
  entry(3, 'player-ghost', 'GhostStride', 2.215, 186.4, 22150),
  entry(4, 'player-north', 'Northstar', 1.964, 174.8, 20510),
  entry(5, 'player-nova', 'NovaPace', 1.786, 152.6, 19380),
  entry(6, 'player-moss', 'MossRunner', 1.298, 119.3, 16840),
  entry(128, 'player-me', 'RunnerOne', 0.842, 86.4, 7640, true),
];

export const MOCK_NEARBY_RANKINGS: LeaderboardEntry[] = [
  entry(1, 'player-ghost', 'GhostStride', 0.215, 6.4, 2450),
  entry(2, 'player-nova', 'NovaPace', 0.186, 5.2, 2180),
  entry(3, 'player-me', 'RunnerOne', 0.142, 3.8, 1840, true),
  entry(4, 'player-moss', 'MossRunner', 0.098, 4.1, 1520),
];

export function getPartyRankings(party = MOCK_PARTIES[0]): LeaderboardEntry[] {
  return [...party.participants]
    .sort((a, b) => b.score - a.score)
    .map((participant, index) => ({
      rank: index + 1,
      userId: participant.id,
      username: participant.username,
      avatarUrl: participant.avatarUrl,
      territoryCapturedKm2: participant.territoryCapturedKm2,
      distanceKm: participant.distanceCoveredKm,
      score: participant.score,
      isCurrentUser: participant.id === 'player-me',
    }));
}

function entry(
  rank: number,
  userId: string,
  username: string,
  territoryCapturedKm2: number,
  distanceKm: number,
  score: number,
  isCurrentUser = false,
): LeaderboardEntry {
  return { rank, userId, username, avatarUrl: '', territoryCapturedKm2, distanceKm, score, isCurrentUser };
}

export const LEADERBOARD_ACCENTS = {
  currentPlayer: Colors.primary,
  competitor: Colors.textSecondary,
} as const;
