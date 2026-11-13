import { create } from 'zustand';

interface PartyState {
  /** Server party the user is currently viewing/playing. */
  activePartyId: string | null;
  setActivePartyId: (id: string | null) => void;
}

export const usePartyStore = create<PartyState>((set) => ({
  activePartyId: null,
  setActivePartyId: (id) => set({ activePartyId: id }),
}));
