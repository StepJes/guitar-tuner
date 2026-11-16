import React, {useMemo, useState} from 'react';
import {LayoutChangeEvent, ScrollView, StyleSheet, Text, View} from 'react-native';
import Svg, {Circle, G, Line} from 'react-native-svg';
import {colors, spacing, type} from '../../constants/theme';
import {Settings} from '../../types/settings';
import {TunerReading} from '../../types/audio';
import {clamp, centsBetween, noteName, targetFrequency} from '../../utils/notes';
import {resolveInstrument, resolveTemperament} from '../../utils/validation';
import {presentReading} from './reading';
import {useReduceMotion} from '../../hooks/useReduceMotion';
import {useStrobePhase} from '../../hooks/useStrobePhase';

interface Props {
  reading: TunerReading | null;
  settings: Settings;
  active: boolean;
}

export function InstrumentView({reading, settings, active}: Props) {
  const [layout, setLayout] = useState({width: 0, height: 0});
  const reduceMotion = useReduceMotion();
  const view = presentReading(reading, settings);
  const instrument = useMemo(() => resolveInstrument(settings), [settings]);
  const temperament = useMemo(() => resolveTemperament(settings), [settings]);
  const phase = useStrobePhase(
    view.cents,
    view.inTune,
    active && view.hasSignal && !reduceMotion,
    0.045,
  );

  const diameter = layout.width
    ? clamp(Math.min(layout.width * 0.82, (layout.height - 76) * 0.92, 420), 170, 420)
    : 220;
  const radius = diameter / 2;
  const centre = radius;
  const ringRadius = radius * 0.87;
  const strobeRadius = radius * 0.72;
  const innerRadius = radius * 0.51;

  const onLayout = (event: LayoutChangeEvent) => {
    const {width, height} = event.nativeEvent.layout;
    setLayout({width, height});
  };

  const ticks = Array.from({length: 72}, (_, index) => {
    const angle = (index / 72) * Math.PI * 2 - Math.PI / 2;
    const major = index % 6 === 0;
    const inner = ringRadius - (major ? 13 : 6);
    return (
      <Line
        key={`tick-${index}`}
        x1={centre + Math.cos(angle) * inner}
        y1={centre + Math.sin(angle) * inner}
        x2={centre + Math.cos(angle) * ringRadius}
        y2={centre + Math.sin(angle) * ringRadius}
        stroke={major ? colors.textSecondary : colors.border}
        strokeWidth={major ? 2 : 1}
      />
    );
  });

  const segments = Array.from({length: 36}, (_, index) => {
    const angle = (index / 36) * Math.PI * 2;
    const length = index % 3 === 0 ? 18 : 11;
    const from = strobeRadius;
    return (
      <Line
        key={`seg-${index}`}
        x1={centre + Math.cos(angle) * from}
        y1={centre + Math.sin(angle) * from}
        x2={centre + Math.cos(angle) * (from - length)}
        y2={centre + Math.sin(angle) * (from - length)}
        stroke={index % 2 === 0 ? view.statusColor : colors.text}
        strokeOpacity={index % 2 === 0 ? 0.95 : 0.42}
        strokeWidth={index % 3 === 0 ? 4 : 2.5}
        strokeLinecap="round"
      />
    );
  });

  const stringStates = instrument.notes.map((midi, index) => {
    const target = targetFrequency(midi, settings.a4Reference, temperament.cents);
    const cents = view.frequency > 0 ? centsBetween(view.frequency, target) : 0;
    return {
      index,
      midi,
      cents,
      active: reading?.stringIndex === index && view.hasSignal,
      tuned: Math.abs(cents) <= settings.inTuneThreshold,
    };
  });

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={styles.dialArea}>
        <Svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`}>
          <Circle cx={centre} cy={centre} r={ringRadius + 3} stroke={colors.border} strokeWidth={1} fill="none" />
          {ticks}
          <Circle
            cx={centre}
            cy={centre}
            r={innerRadius}
            fill={colors.bgElevated}
            stroke={view.inTune ? colors.accent : colors.border}
            strokeWidth={view.inTune ? 2 : 1}
          />
          <Circle cx={centre} cy={centre} r={strobeRadius + 14} stroke={colors.grid} strokeWidth={1} fill="none" />
          <G
            rotation={reduceMotion ? 0 : phase * 360}
            origin={`${centre}, ${centre}`}>
            {segments}
          </G>
        </Svg>
        <View style={[styles.readout, {width: diameter, height: diameter}]} pointerEvents="none">
          <View style={styles.noteRow}>
            <Text
              style={[
                styles.note,
                {
                  fontSize: clamp(diameter * 0.2, 34, 78),
                  lineHeight: clamp(diameter * 0.22, 40, 86),
                  color: view.hasSignal ? colors.text : colors.textMuted,
                },
              ]}
              accessibilityLabel={view.hasSignal ? `Note ${view.note} ${view.octave}` : 'Listening'}>
              {view.note}
            </Text>
            {view.hasSignal ? (
              <Text style={[styles.octave, {fontSize: clamp(diameter * 0.09, 18, 30)}]}>
                {view.octave}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.cents, {color: view.statusColor}]}>{view.centsText}</Text>
          <Text style={styles.hz}>{view.hzText}</Text>
          <Text style={[styles.status, {color: view.statusColor}]}>{view.statusText}</Text>
        </View>
      </View>

      <View style={styles.railWrap}>
        <ScrollView
          horizontal
          contentContainerStyle={styles.rail}
          showsHorizontalScrollIndicator={false}
          accessibilityLabel="Instrument strings">
          {stringStates.map(item => {
            const tone = item.active
              ? item.tuned
                ? colors.accent
                : item.cents < 0
                  ? colors.flat
                  : colors.sharp
              : colors.textMuted;
            return (
              <View
                key={`${item.midi}-${item.index}`}
                style={[
                  styles.stringPill,
                  item.active && {borderColor: tone, backgroundColor: `${tone}1A`},
                ]}
                accessibilityLabel={`String ${item.index + 1}, ${noteName(item.midi, settings.noteNameStyle)}${Math.floor(
                  item.midi / 12,
                ) - 1}${item.active ? `, ${Math.round(item.cents)} cents` : ''}`}>
                <Text style={[styles.stringNote, {color: item.active ? tone : colors.textSecondary}]}>
                  {noteName(item.midi, settings.noteNameStyle)}
                  {Math.floor(item.midi / 12) - 1}
                </Text>
                {item.active ? (
                  <Text style={[styles.stringCents, {color: tone}]}>{Math.round(item.cents)}¢</Text>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  dialArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 170,
  },
  readout: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  note: {
    fontFamily: type.condensed,
    fontWeight: '700',
    fontSize: 66,
    lineHeight: 74,
    letterSpacing: -2,
  },
  octave: {
    color: colors.textSecondary,
    fontFamily: type.condensed,
    fontWeight: '600',
    fontSize: 28,
    marginTop: 8,
    marginLeft: 2,
  },
  cents: {
    fontFamily: type.mono,
    fontSize: 18,
    fontWeight: '600',
    marginTop: -2,
  },
  hz: {
    color: colors.textSecondary,
    fontFamily: type.mono,
    fontSize: 12,
    marginTop: 3,
  },
  status: {
    fontFamily: type.condensed,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1.4,
    marginTop: 7,
  },
  railWrap: {
    minHeight: 56,
    maxHeight: 60,
    justifyContent: 'center',
    paddingBottom: spacing.xs,
  },
  rail: {
    gap: 6,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  stringPill: {
    minWidth: 42,
    height: 40,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  stringNote: {
    fontFamily: type.condensed,
    fontSize: 15,
    fontWeight: '600',
  },
  stringCents: {
    fontFamily: type.mono,
    fontSize: 8,
    marginTop: -1,
  },
});
