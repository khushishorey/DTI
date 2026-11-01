import React from 'react';
import { Polygon } from 'react-native-maps';
import { Territory } from '../../types/territory';

interface TerritoryOverlaysProps {
  territories: Territory[];
  onSelect?: (territory: Territory) => void;
}

export function TerritoryOverlays({ territories, onSelect }: TerritoryOverlaysProps) {
  return (
    <>
      {territories.map((territory) => (
        <Polygon
          key={territory.id}
          coordinates={territory.coordinates}
          fillColor={withAlpha(territory.ownerColor, territory.isCurrentPlayer ? 0.22 : 0.16)}
          strokeColor={withAlpha(territory.ownerColor, 0.82)}
          strokeWidth={territory.isCurrentPlayer ? 2.2 : 1.5}
          tappable
          onPress={() => onSelect?.(territory)}
        />
      ))}
    </>
  );
}

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
