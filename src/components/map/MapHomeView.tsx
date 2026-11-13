import type { ComponentProps, ComponentType } from 'react';
import { hasMapLibre } from '../../lib/nativeMap';

type Props = ComponentProps<typeof import('./MapHomeView.maplibre').MapHomeView>;

// Real map in a development build; the SVG preview (same data, no tiles) in Expo Go.
export const MapHomeView: ComponentType<Props> = hasMapLibre
  ? require('./MapHomeView.maplibre').MapHomeView
  : require('./MapHomeView.web').MapHomeView;
