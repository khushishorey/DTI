import type { ComponentProps, ComponentType } from 'react';
import { hasMapLibre } from '../../lib/nativeMap';

type Props = ComponentProps<typeof import('./RunMapView.maplibre').RunMapView>;

// Real map in a development build; the SVG preview in Expo Go.
export const RunMapView: ComponentType<Props> = hasMapLibre
  ? require('./RunMapView.maplibre').RunMapView
  : require('./RunMapView.web').RunMapView;
