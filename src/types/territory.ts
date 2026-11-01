export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type TerritoryViewMode = 'territory' | 'grid';
export type TerritoryStatus = 'owned' | 'unclaimed' | 'contested';

export interface Territory {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  ownerColor: string;
  isCurrentPlayer: boolean;
  areaKm2: number;
  capturedAt: string;
  coordinates: Coordinates[];
  status?: TerritoryStatus;
}

export interface HexCell {
  id: string;
  center: Coordinates;
  vertices: Coordinates[];
  ownerId?: string;
  ownerColor?: string;
  isCurrentPlayer: boolean;
}
