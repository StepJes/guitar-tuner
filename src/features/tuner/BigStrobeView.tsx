import React, {useMemo, useState} from 'react';
import {LayoutChangeEvent, StyleSheet, Text, View} from 'react-native';
import Svg, {G, Line, Polygon} from 'react-native-svg';
import {colors, spacing, type} from '../../constants/theme';
import {Settings} from '../../types/settings';
import {TunerReading} from '../../types/audio';
import {clamp} from '../../utils/notes';
import {presentReading} from './reading';
import {useReduceMotion} from '../../hooks/useReduceMotion';
import {useStrobePhase} from '../../hooks/useStrobePhase';

interface Props {
  reading: TunerReading | null;
  settings: Settings;
  active: boolean;
}

export function BigStrobeView({reading, settings, active}: Props) {
  const [layout, setLayout] = useState({width: 0, height: 0});
  const reduceMotion = useReduceMotion();
  const view = presentReading(reading, settings);
  const phase = useStrobePhase(
    view.cents,
    view.inTune,
    active && view.hasSignal && !reduceMotion,
    0.045,
  );

  const noteSize = layout.width
    ? clamp(Math.min(layout.width * 0.36, layout.height * 0.34, 190), 70, 190)
    : 130;
  const spacing = 48;
  const shift = (reduceMotion ? 0 : phase) * spacing;

  const bars = useMemo(
    () =>
      Array.from({length: 26}, (_, index) => {
        const x = -spacing + index * spacing + shift;
        const tall = index % 4 === 0;
        const height = tall ? 112 : index % 2 === 0 ? 70 : 44;
        return (
          <Polygon
            key={`big-bar-${index}`}
            points={`${x + 17},${80 - height / 2} ${x + 29},${80 - height / 2} ${x + 17},${
              80 + height / 2
            } ${x + 5},${80 + height / 2}`}
            fill={view.statusColor}
            opacity={tall ? 0.95 : index % 2 === 0 ? 0.56 : 0.28}
          />
        );
      }),
    [shift, view.statusColor],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const {width, height} = event.nativeEvent.layout;
    setLayout({width, height});
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={styles.top}>
        <View style={styles.noteWrap}>
          <Text
            style={[
              styles.note,
              {
                fontSize: noteSize,
                lineHeight: noteSize * 1.04,
                color: view.hasSignal ? colors.text : colors.textMuted,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            accessibilityLabel={view.hasSignal ? `Note ${view.note} ${view.octave}` : 'Listening'}
            accessibilityLiveRegion="polite">
            {view.note}
            {view.hasSignal ? <Text style={styles.octave}>{view.octave}</Text> : null}
          </Text>
          <Text style={styles.frequency}>{view.hzText}</Text>
        </View>

        <View style={styles.measureBlock}>
          <Text style={[styles.cents, {color: view.statusColor}]}>{view.centsText}</Text>
          <View style={[styles.statusWrap, {borderColor: `${view.statusColor}66`}]}>
            <Text style={[styles.status, {color: view.statusColor}]}>{view.statusText}</Text>
          </View>
          <Text style={styles.target}>
            TARGET {view.hasSignal ? `${view.targetHz.toFixed(1)} Hz` : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.strobeArea}>
        <View style={styles.directionRow}>
          <Text style={[styles.direction, {color: colors.flat}]}>◀◀ FLAT</Text>
          <Text style={styles.bandLabel}>PITCH DEVIATION STROBE</Text>
          <Text style={[styles.direction, {color: colors.sharp}]}>SHARP ▶▶</Text>
        </View>
        <Svg width="100%" height="100%" viewBox="0 0 800 160" preserveAspectRatio="none">
          <Line x1={0} y1={80} x2={800} y2={80} stroke={colors.grid} strokeWidth={1} />
          <G>{bars}</G>
          <Line
            x1={400}
            y1={10}
            x2={400}
            y2={150}
            stroke={view.inTune ? colors.accent : colors.border}
            strokeWidth={2}
          />
          <Line
            x1={0}
            y1={8}
            x2={0}
            y2={152}
            stroke={colors.border}
            strokeWidth={3}
          />
          <Line
            x1={800}
            y1={8}
            x2={800}
            y2={152}
            stroke={colors.border}
            strokeWidth={3}
          />
        </Svg>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.bottomText}>
          {view.inTune ? 'STROBE LOCKED · IN TUNE' : view.hasSignal ? 'DRIFT SHOWS CENTS ERROR' : 'WAITING FOR A NOTE'}
        </Text>
        <Text style={styles.bottomMeta}>
          {settings.sampleRate / 1000} kHz · {settings.analysisRate === 1 ? 'HIGH' : settings.analysisRate === -1 ? 'LOW' : 'MEDIUM'} ANALYSIS
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  top: {
    flex: 1,
    minHeight: 150,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  noteWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexShrink: 1,
    gap: spacing.sm,
  },
  note: {
    fontFamily: type.condensed,
    fontWeight: '700',
    letterSpacing: -4,
  },
  octave: {
    fontFamily: type.condensed,
    fontWeight: '600',
    fontSize: 42,
    color: colors.textSecondary,
  },
  frequency: {
    color: colors.textSecondary,
    fontFamily: type.mono,
    fontSize: 16,
    marginBottom: 18,
  },
  measureBlock: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  cents: {
    fontFamily: type.mono,
    fontSize: 42,
    fontWeight: '600',
    letterSpacing: -2,
  },
  statusWrap: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  status: {
    fontFamily: type.condensed,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
  },
  target: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  strobeArea: {
    flex: 1.25,
    minHeight: 150,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  directionRow: {
    position: 'absolute',
    top: 5,
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  direction: {
    fontFamily: type.condensed,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  bandLabel: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 8,
    letterSpacing: 1.4,
  },
  bottom: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  bottomText: {
    color: colors.textMuted,
    fontFamily: type.condensed,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  bottomMeta: {
    color: colors.border,
    fontFamily: type.mono,
    fontSize: 8,
  },
});
