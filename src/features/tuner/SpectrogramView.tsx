import React, {useEffect, useMemo, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Svg, {Line, Path, Rect, Text as SvgText} from 'react-native-svg';
import {colors, spectrogramStops, spacing, type} from '../../constants/theme';
import {Settings} from '../../types/settings';
import {TunerReading} from '../../types/audio';
import {clamp, noteNameWithOctave} from '../../utils/notes';
import {heatColors} from '../../utils/color';
import {presentReading} from './reading';

interface Props {
  reading: TunerReading | null;
  settings: Settings;
  active: boolean;
}

const HISTORY_COLUMNS = 72;
const PLOT_LEFT = 38;
const PLOT_RIGHT = 8;
const PLOT_TOP = 16;
const PLOT_BOTTOM = 22;
const VIEWBOX_WIDTH = 400;
const VIEWBOX_HEIGHT = 300;

const BOTTOM_HZ = 30;
const TOP_HZ = 6000;

function frequencyToY(frequency: number) {
  const normalized =
    Math.log(Math.max(BOTTOM_HZ, frequency) / BOTTOM_HZ) /
    Math.log(TOP_HZ / BOTTOM_HZ);
  const plotHeight = VIEWBOX_HEIGHT - PLOT_TOP - PLOT_BOTTOM;
  return PLOT_TOP + (1 - clamp(normalized, 0, 1)) * plotHeight;
}

export function SpectrogramView({reading, settings, active}: Props) {
  const [history, setHistory] = useState<number[][]>([]);
  const lastTimestampRef = useRef(0);
  const view = presentReading(reading, settings);

  useEffect(() => {
    if (!active || !reading || reading.timestamp === lastTimestampRef.current) {
      return;
    }
    lastTimestampRef.current = reading.timestamp;
    const spectrum = reading.spectrum;
    if (!Array.isArray(spectrum) || spectrum.length === 0) {
      return;
    }
    setHistory(previous => {
      const next = [...previous, spectrum.slice()];
      return next.length > HISTORY_COLUMNS ? next.slice(next.length - HISTORY_COLUMNS) : next;
    });
  }, [active, reading]);

  const heatPalette = useMemo(() => {
    if ((settings.debugMask & 0b100) !== 0) {
      return Array.from({length: 20}, () => colors.accentDim);
    }
    const paletteSize = settings.texTypeSpectrogram === 4 ? 8 : 24;
    return heatColors(spectrogramStops, paletteSize);
  }, [settings.debugMask, settings.texTypeSpectrogram]);

  const bandCount = history[0]?.length || reading?.spectrum.length || 96;
  const textureDisabled = (settings.debugMask & 0b100) !== 0;
  const bucketCount = textureDisabled ? 20 : settings.texTypeSpectrogram === 4 ? 8 : 24;
  const plotWidth = VIEWBOX_WIDTH - PLOT_LEFT - PLOT_RIGHT;
  const plotHeight = VIEWBOX_HEIGHT - PLOT_TOP - PLOT_BOTTOM;
  const cellWidth = plotWidth / HISTORY_COLUMNS;
  const cellHeight = plotHeight / bandCount;
  const offset = HISTORY_COLUMNS - history.length;

  const paths = useMemo(() => {
    const buckets = Array.from({length: bucketCount}, () => '');
    for (let column = 0; column < history.length; column += 1) {
      const spectrum = history[column];
      const x = PLOT_LEFT + (offset + column) * cellWidth;
      for (let band = 0; band < bandCount; band += 1) {
        const raw = spectrum[band] ?? 0;
        if (raw <= 0.012) {
          continue;
        }
        const bucket = Math.min(
          bucketCount - 1,
          Math.max(0, Math.round(raw * (bucketCount - 1))),
        );
        const y = PLOT_TOP + (1 - (band + 1) / bandCount) * plotHeight;
        buckets[bucket] += `M${x.toFixed(2)} ${y.toFixed(2)}h${(cellWidth + 0.35).toFixed(
          2,
        )}v${(cellHeight + 0.35).toFixed(2)}h-${(cellWidth + 0.35).toFixed(2)}Z`;
      }
    }
    return buckets;
  }, [bandCount, bucketCount, cellHeight, cellWidth, history, offset, plotHeight]);

  const octaveLines = useMemo(() => {
    const lines: React.ReactNode[] = [];
    for (let midi = 24; midi <= 108; midi += 12) {
      const frequency = 440 * Math.pow(2, (midi - 69) / 12);
      if (frequency < BOTTOM_HZ || frequency > TOP_HZ) {
        continue;
      }
      const y = frequencyToY(frequency);
      lines.push(
        <Line
          key={`octave-${midi}`}
          x1={PLOT_LEFT}
          y1={y}
          x2={VIEWBOX_WIDTH - PLOT_RIGHT}
          y2={y}
          stroke={colors.grid}
          strokeWidth={0.8}
        />,
      );
      lines.push(
        <SvgText
          key={`octave-label-${midi}`}
          x={PLOT_LEFT - 5}
          y={y + 3}
          fill={colors.textMuted}
          fontSize={8}
          fontFamily="monospace"
          textAnchor="end">
          {noteNameWithOctave(midi, settings.noteNameStyle)}
        </SvgText>,
      );
    }
    for (let column = 0; column < HISTORY_COLUMNS; column += 12) {
      const x = PLOT_LEFT + column * cellWidth;
      lines.push(
        <Line
          key={`time-${column}`}
          x1={x}
          y1={PLOT_TOP}
          x2={x}
          y2={VIEWBOX_HEIGHT - PLOT_BOTTOM}
          stroke={colors.grid}
          strokeOpacity={0.55}
          strokeWidth={0.6}
        />,
      );
    }
    return lines;
  }, [cellWidth, settings.noteNameStyle]);

  const pitchY = view.frequency > 0 ? frequencyToY(view.frequency) : null;
  const pitchLabel = view.hasSignal ? view.noteText : '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>SPECTROGRAM</Text>
          <Text style={styles.noteLine}>
            <Text style={[styles.note, {color: view.statusColor}]}>{view.noteText}</Text>
            <Text style={styles.frequency}> {view.hzText}</Text>
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.liveRow}>
            <View style={[styles.liveDot, view.hasSignal && styles.liveDotOn]} />
            <Text style={styles.liveText}>{view.hasSignal ? 'LIVE' : 'WAITING'}</Text>
          </View>
          <Text style={styles.range}>
            30 Hz — {Math.min(6000, (reading?.sampleRate || settings.sampleRate) / 2).toFixed(0)} Hz
          </Text>
        </View>
      </View>

      <View style={styles.plotWrap}>
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          preserveAspectRatio="none">
          <Rect x={0} y={0} width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill={colors.bg} />
          <Rect
            x={PLOT_LEFT}
            y={PLOT_TOP}
            width={plotWidth}
            height={plotHeight}
            fill="#040A0D"
            stroke={colors.border}
            strokeWidth={0.8}
          />
          {octaveLines}
          {paths.map((path, index) =>
            path ? (
              <Path
                key={`heat-${index}`}
                d={path}
                fill={heatPalette[index] || colors.accent}
                fillOpacity={textureDisabled ? 0.18 + (index / bucketCount) * 0.7 : 1}
              />
            ) : null,
          )}
          {pitchY !== null ? (
            <>
              <Line
                x1={PLOT_LEFT}
                y1={pitchY}
                x2={VIEWBOX_WIDTH - PLOT_RIGHT}
                y2={pitchY}
                stroke={colors.accent}
                strokeWidth={1.2}
                strokeDasharray="3 3"
              />
              <Line
                x1={VIEWBOX_WIDTH - PLOT_RIGHT - 9}
                y1={pitchY}
                x2={VIEWBOX_WIDTH - PLOT_RIGHT}
                y2={pitchY}
                stroke={colors.accent}
                strokeWidth={4}
              />
              <SvgText
                x={VIEWBOX_WIDTH - PLOT_RIGHT - 12}
                y={Math.max(PLOT_TOP + 8, pitchY - 4)}
                fill={colors.accent}
                fontSize={9}
                fontFamily="monospace"
                textAnchor="end">
                {pitchLabel}
              </SvgText>
            </>
          ) : null}
          <SvgText
            x={PLOT_LEFT}
            y={VIEWBOX_HEIGHT - 7}
            fill={colors.textMuted}
            fontSize={7}
            fontFamily="monospace">
            OLDEST
          </SvgText>
          <SvgText
            x={VIEWBOX_WIDTH - PLOT_RIGHT}
            y={VIEWBOX_HEIGHT - 7}
            fill={colors.accentDim}
            fontSize={7}
            fontFamily="monospace"
            textAnchor="end">
            NOW
          </SvgText>
        </Svg>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {settings.texTypeSpectrogram === 4 ? 'RGBA-5551 texture' : 'RGBA-8888 texture'}
        </Text>
        <Text style={styles.footerText}>
          {history.length}/{HISTORY_COLUMNS} frames · 96 log bands
        </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: colors.textMuted,
    fontFamily: type.condensed,
    fontSize: 10,
    letterSpacing: 2,
  },
  noteLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  note: {
    fontFamily: type.condensed,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  frequency: {
    color: colors.textSecondary,
    fontFamily: type.mono,
    fontSize: 12,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  liveDotOn: {
    backgroundColor: colors.accent,
  },
  liveText: {
    color: colors.textSecondary,
    fontFamily: type.mono,
    fontSize: 9,
    letterSpacing: 1,
  },
  range: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 8,
  },
  plotWrap: {
    flex: 1,
    minHeight: 140,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingTop: 5,
  },
  footerText: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 8,
  },
});
