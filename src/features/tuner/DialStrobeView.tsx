import React, {useMemo} from 'react';
import {StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import Svg, {Circle, G, Line, Path, Polygon, Text as SvgText} from 'react-native-svg';
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

const CX = 200;
const CY = 224;
const R = 154;

function point(angle: number, radius: number) {
  const radians = (angle * Math.PI) / 180;
  return {x: CX + Math.cos(radians) * radius, y: CY + Math.sin(radians) * radius};
}

function gaugeArc(radius: number): string {
  const start = point(180, radius);
  const end = point(360, radius);
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
}

export function DialStrobeView({reading, settings, active}: Props) {
  const {width, height} = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const view = presentReading(reading, settings);
  const phase = useStrobePhase(
    view.cents,
    view.inTune,
    active && view.hasSignal && !reduceMotion,
    0.075,
  );
  const noteSize = clamp(Math.min(width, height) * 0.14, 44, 76);
  const clampedCents = view.hasSignal ? clamp(view.cents, -50, 50) : 0;
  const needleAngle = 180 + ((clampedCents + 50) / 100) * 180;
  const needleEnd = point(needleAngle, R * 0.82);
  const needleColor = view.hasSignal ? view.statusColor : colors.textMuted;
  const barSpacing = 26;
  const shift = phase * barSpacing;

  const gaugeTicks = useMemo(
    () =>
      Array.from({length: 21}, (_, index) => {
        const cents = -50 + index * 5;
        const angle = 180 + ((cents + 50) / 100) * 180;
        const major = index % 5 === 0;
        const outer = point(angle, R);
        const inner = point(angle, R - (major ? 15 : 8));
        return (
          <Line
            key={`gt-${index}`}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke={major ? colors.textSecondary : colors.border}
            strokeWidth={major ? 2 : 1}
          />
        );
      }),
    [],
  );

  const gaugeLabels = useMemo(
    () =>
      [-50, -25, 0, 25, 50].map(value => {
        const angle = 180 + ((value + 50) / 100) * 180;
        const position = point(angle, R - 30);
        return (
          <SvgText
            key={`gl-${value}`}
            x={position.x}
            y={position.y}
            fill={value === 0 ? colors.accent : colors.textSecondary}
            fontSize={12}
            fontFamily="monospace"
            textAnchor="middle"
            alignmentBaseline="middle">
            {value > 0 ? `+${value}` : `${value}`}
          </SvgText>
        );
      }),
    [],
  );

  const bars = useMemo(
    () =>
      Array.from({length: 28}, (_, index) => {
        const x = -barSpacing + index * barSpacing + shift;
        const heightRatio = index % 4 === 0 ? 1 : index % 2 === 0 ? 0.72 : 0.46;
        const barHeight = 48 * heightRatio;
        return (
          <Polygon
            key={`bar-${index}`}
            points={`${x + 6},${34 - barHeight / 2} ${x + 12},${34 - barHeight / 2} ${
              x + 6
            },${34 + barHeight / 2} ${x},${34 + barHeight / 2}`}
            fill={needleColor}
            opacity={index % 4 === 0 ? 0.95 : index % 2 === 0 ? 0.62 : 0.32}
          />
        );
      }),
    [shift, needleColor],
  );

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.noteBlock}>
          <Text
            style={[styles.note, {fontSize: noteSize, color: view.hasSignal ? colors.text : colors.textMuted}]}
            accessibilityLabel={view.hasSignal ? `Note ${view.note} ${view.octave}` : 'Listening'}>
            {view.note}
            {view.hasSignal ? <Text style={styles.octave}>{view.octave}</Text> : null}
          </Text>
          <Text style={styles.frequency}>{view.hzText}</Text>
        </View>
        <View style={styles.statusBlock}>
          <Text style={[styles.cents, {color: view.statusColor}]}>{view.centsText}</Text>
          <View style={[styles.statusPill, {borderColor: `${view.statusColor}66`}]}>
            <Text style={[styles.status, {color: view.statusColor}]}>{view.statusText}</Text>
          </View>
          <Text style={styles.target}>Target {view.hasSignal ? `${view.targetHz.toFixed(1)} Hz` : '—'}</Text>
        </View>
      </View>

      <View style={styles.dialWrap}>
        <Svg width="100%" height="100%" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet">
          <Path d={gaugeArc(R)} stroke={colors.border} strokeWidth={2} fill="none" />
          <Path
            d={gaugeArc(R - 7)}
            stroke={view.inTune ? `${colors.accent}66` : 'transparent'}
            strokeWidth={6}
            fill="none"
          />
          {gaugeTicks}
          {gaugeLabels}
          <Circle cx={CX} cy={CY} r={7} fill={colors.surfaceAlt} stroke={colors.border} strokeWidth={1} />
          <Line
            x1={CX}
            y1={CY}
            x2={needleEnd.x}
            y2={needleEnd.y}
            stroke={needleColor}
            strokeWidth={4}
            strokeLinecap="round"
          />
          <Circle cx={CX} cy={CY} r={3.5} fill={needleColor} />
        </Svg>
      </View>

      <View style={styles.strobePanel}>
        <View style={styles.strobeHeader}>
          <Text style={[styles.direction, {color: colors.flat}]}>◀ FLAT</Text>
          <Text style={styles.strobeLabel}>STROBE</Text>
          <Text style={[styles.direction, {color: colors.sharp}]}>SHARP ▶</Text>
        </View>
        <Svg width="100%" height={68} viewBox="0 0 400 68" preserveAspectRatio="none">
          <Line x1={0} y1={34} x2={400} y2={34} stroke={colors.grid} strokeWidth={1} />
          <G>{bars}</G>
          <Line
            x1={200}
            y1={8}
            x2={200}
            y2={60}
            stroke={view.inTune ? colors.accent : colors.border}
            strokeWidth={1}
          />
        </Svg>
        <View style={styles.lockRow}>
          <Text style={styles.lockText}>
            {view.inTune ? 'STROBE LOCKED' : view.hasSignal ? 'Strobe drift follows cents' : 'No signal'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
  },
  noteBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  note: {
    fontFamily: type.condensed,
    fontWeight: '700',
    lineHeight: 74,
    letterSpacing: -1,
  },
  octave: {
    fontFamily: type.condensed,
    fontSize: 0.42 * 54,
    color: colors.textSecondary,
  },
  frequency: {
    color: colors.textSecondary,
    fontFamily: type.mono,
    fontSize: 13,
    marginBottom: 13,
  },
  statusBlock: {
    alignItems: 'flex-end',
    gap: 5,
  },
  cents: {
    fontFamily: type.mono,
    fontSize: 24,
    fontWeight: '600',
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  status: {
    fontFamily: type.condensed,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  target: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 10,
  },
  dialWrap: {
    flex: 1,
    minHeight: 120,
    marginTop: -6,
  },
  strobePanel: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
    marginBottom: spacing.xs,
  },
  strobeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingTop: 5,
  },
  direction: {
    fontFamily: type.condensed,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  strobeLabel: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 9,
    letterSpacing: 2,
  },
  lockRow: {
    alignItems: 'center',
    paddingBottom: 5,
  },
  lockText: {
    color: colors.textMuted,
    fontFamily: type.body,
    fontSize: 9,
    letterSpacing: 0.4,
  },
});
