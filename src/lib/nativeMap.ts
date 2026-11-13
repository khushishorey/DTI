/**
 * MapLibre is a native module: it exists in development builds but not in Expo Go.
 * Importing it where it's missing throws at load time, so probe with a guarded require.
 */
export const hasMapLibre: boolean = (() => {
  try {
    require('@maplibre/maplibre-react-native');
    return true;
  } catch {
    if (__DEV__) {
      console.warn('[map] MapLibre native module not found (Expo Go?). Showing the preview map. Use a development build for the real map.');
    }
    return false;
  }
})();
