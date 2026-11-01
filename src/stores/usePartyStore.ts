import { create } from 'zustand';
import { Colors } from '../constants/theme';
import { CURRENT_PARTICIPANT, CURRENT_PLAYER_ID, MOCK_PARTIES } from '../data/mockParties';
import { CreatePartyInput, Party } from '../types/party';

interface PartyState {
  parties: Party[];
  activeParty: Party | null;
  setActiveParty: (party: Party | null) => void;
  setParties: (parties: Party[]) => void;
  createParty: (input: CreatePartyInput) => Party;
  joinParty: (partyId: string) => Party | null;
  joinPartyByCode: (code: string) => Party | null;
  startCompetition: () => Party | null;
  completeCompetition: () => Party | null;
  clearActiveParty: () => void;
}

function updateParty(parties: Party[], updated: Party) {
  return parties.map((party) => party.id === updated.id ? updated : party);
}

export const usePartyStore = create<PartyState>((set, get) => ({
  parties: MOCK_PARTIES,
  activeParty: null,

  setActiveParty: (party) => set({ activeParty: party }),
  setParties: (parties) => set({ parties }),

  createParty: (input) => {
    const party: Party = {
      id: `party-${Date.now()}`,
      name: input.name.trim(),
      code: makePartyCode(input.name),
      visibility: input.visibility,
      gameMode: input.gameMode,
      durationMinutes: input.durationMinutes,
      maxParticipants: input.maxParticipants,
      status: 'lobby',
      hostId: CURRENT_PLAYER_ID,
      participants: [{
        ...CURRENT_PARTICIPANT,
        isHost: true,
        score: 0,
        territoryCapturedKm2: 0,
        distanceCoveredKm: 0,
        color: Colors.primary,
      }],
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ parties: [party, ...state.parties], activeParty: party }));
    return party;
  },

  joinParty: (partyId) => {
    const party = get().parties.find((item) => item.id === partyId);
    if (!party || party.status === 'completed') return null;

    const alreadyJoined = party.participants.some((participant) => participant.id === CURRENT_PLAYER_ID);
    if (!alreadyJoined && party.participants.length >= party.maxParticipants) return null;
    const updated = alreadyJoined
      ? party
      : { ...party, participants: [...party.participants, { ...CURRENT_PARTICIPANT, isHost: false }] };
    set((state) => ({ parties: updateParty(state.parties, updated), activeParty: updated }));
    return updated;
  },

  joinPartyByCode: (code) => {
    const party = get().parties.find((item) => item.code.toUpperCase() === code.trim().toUpperCase());
    return party ? get().joinParty(party.id) : null;
  },

  startCompetition: () => {
    const party = get().activeParty;
    if (!party || party.hostId !== CURRENT_PLAYER_ID || party.status !== 'lobby') return null;
    const startedAt = Date.now();
    const mockRunners = [
      { id: 'player-nova', username: 'NovaPace', avatarUrl: '', isHost: false, score: 520, territoryCapturedKm2: 0.012, distanceCoveredKm: 0.8, color: Colors.competitorBlue },
      { id: 'player-ghost', username: 'GhostStride', avatarUrl: '', isHost: false, score: 470, territoryCapturedKm2: 0.01, distanceCoveredKm: 0.72, color: Colors.competitorOrange },
      { id: 'player-moss', username: 'MossRunner', avatarUrl: '', isHost: false, score: 390, territoryCapturedKm2: 0.008, distanceCoveredKm: 0.65, color: Colors.competitorPurple },
    ];
    const updated: Party = {
      ...party,
      status: 'in_progress',
      participants: party.participants.length === 1
        ? [...party.participants, ...mockRunners.slice(0, party.maxParticipants - 1)]
        : party.participants,
      startedAt,
      endsAt: startedAt + party.durationMinutes * 60 * 1000,
    };
    set((state) => ({ parties: updateParty(state.parties, updated), activeParty: updated }));
    return updated;
  },

  completeCompetition: () => {
    const party = get().activeParty;
    if (!party || party.status !== 'in_progress') return null;
    const updated = { ...party, status: 'completed' as const };
    set((state) => ({ parties: updateParty(state.parties, updated), activeParty: updated }));
    return updated;
  },
  clearActiveParty: () => set({ activeParty: null }),
}));

function makePartyCode(name: string) {
  const letters = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4).padEnd(4, 'X');
  const suffix = Math.floor(10 + Math.random() * 90);
  return `${letters}${suffix}`;
}
