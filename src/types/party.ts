export type PartyGameMode = 'territory_control' | 'distance_race' | 'king_of_the_hill';
export type PartyVisibility = 'public' | 'private';
export type PartyStatus = 'lobby' | 'in_progress' | 'completed';

export interface PartyParticipant {
  id: string;
  username: string;
  avatarUrl: string;
  isHost: boolean;
  score: number;
  territoryCapturedKm2: number;
  distanceCoveredKm: number;
  color: string;
}

export interface Party {
  id: string;
  name: string;
  code: string;
  visibility: PartyVisibility;
  gameMode: PartyGameMode;
  durationMinutes: number;
  maxParticipants: number;
  status: PartyStatus;
  hostId: string;
  participants: PartyParticipant[];
  createdAt: string;
  startedAt?: number;
  endsAt?: number;
}

export interface CreatePartyInput {
  name: string;
  visibility: PartyVisibility;
  gameMode: PartyGameMode;
  durationMinutes: number;
  maxParticipants: number;
}
