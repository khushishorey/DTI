import { TurboModuleRegistry } from 'react-native';

/**
 * MapLibre is a native module: it exists in development builds but not in Expo Go.
 * Probe the native module itself. Do not `require()` the package here: Metro resolves
 * require() to the commonjs build and import to the module build, so loading both
 * registers MLRNCamera twice and crashes.
 */
export const hasMapLibre: boolean = (() => {
  const found = TurboModuleRegistry.get('MLRNMapViewModule') != null;
  if (!found && __DEV__) {
    console.warn('[map] MapLibre native module not found (Expo Go?). Showing the preview map. Use a development build for the real map.');
  }
  return found;
})();
