import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Colors } from '../../constants/theme';

export function MapCanvas({ children, style, ...props }: ViewProps) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.canvas, style]} {...props}>
      <View pointerEvents="none" style={[styles.road, styles.roadOne]} />
      <View pointerEvents="none" style={[styles.road, styles.roadTwo]} />
      <View pointerEvents="none" style={[styles.road, styles.roadThree]} />
      <View pointerEvents="none" style={[styles.road, styles.roadFour]} />
      <View pointerEvents="none" style={[styles.roadFine, styles.roadFive]} />
      <View pointerEvents="none" style={[styles.roadFine, styles.roadSix]} />
      <View pointerEvents="none" style={[styles.park, styles.parkOne]} />
      <View pointerEvents="none" style={[styles.park, styles.parkTwo]} />
      {children}
      <View pointerEvents="none" style={styles.previewLabel}>
        <View style={styles.previewDot} />
        <View style={styles.previewLabelLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    overflow: 'hidden',
    backgroundColor: '#101714',
  },
  road: {
    position: 'absolute',
    height: 17,
    backgroundColor: '#25312B',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#344039',
  },
  roadOne: {
    top: '24%',
    left: '-15%',
    width: '132%',
    transform: [{ rotate: '-12deg' }],
  },
  roadTwo: {
    top: '58%',
    left: '-10%',
    width: '130%',
    transform: [{ rotate: '8deg' }],
  },
  roadThree: {
    top: '41%',
    left: '-16%',
    width: '130%',
    transform: [{ rotate: '-28deg' }],
  },
  roadFour: {
    top: '45%',
    left: '-10%',
    width: '130%',
    transform: [{ rotate: '36deg' }],
  },
  roadFine: {
    position: 'absolute',
    height: 8,
    backgroundColor: '#1C2721',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2C3831',
  },
  roadFive: {
    top: '76%',
    left: '-8%',
    width: '120%',
    transform: [{ rotate: '-5deg' }],
  },
  roadSix: {
    top: '8%',
    left: '24%',
    width: '120%',
    transform: [{ rotate: '74deg' }],
  },
  park: {
    position: 'absolute',
    backgroundColor: 'rgba(121, 200, 61, 0.07)',
    borderColor: 'rgba(121, 200, 61, 0.14)',
    borderWidth: 1,
    borderRadius: 32,
  },
  parkOne: {
    width: 150,
    height: 95,
    top: '35%',
    left: '-12%',
    transform: [{ rotate: '-18deg' }],
  },
  parkTwo: {
    width: 170,
    height: 85,
    top: '70%',
    right: '-20%',
    transform: [{ rotate: '20deg' }],
  },
  previewLabel: {
    position: 'absolute',
    right: 14,
    top: 14,
    opacity: 0.65,
  },
  previewDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: Colors.textMuted,
  },
  previewLabelLine: {
    width: 17,
    height: 1,
    backgroundColor: Colors.textMuted,
    marginTop: 4,
  },
});
