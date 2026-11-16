import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {CHORD_QUALITIES} from '../../constants/presets';
import {colors, spacing, type} from '../../constants/theme';
import {TunerReading} from '../../types/audio';
import {Settings} from '../../types/settings';
import {clamp, noteName} from '../../utils/notes';
import {withAlpha} from '../../utils/color';
import {chordDisplayName, presentReading} from './reading';

interface Props {
  reading: TunerReading | null;
  settings: Settings;
  active: boolean;
}

export function ChordsView({reading, settings}: Props) {
  const view = presentReading(reading, settings);
  const scores = useMemo(() => reading?.chordScores ?? [], [reading]);
  const hasChord = Boolean(reading && reading.chordRoot >= 0 && reading.chordConfidence >= 0.22);
  const chordName = hasChord
    ? chordDisplayName(reading!.chordRoot, reading!.chordQuality, settings.noteNameStyle)
    : '—';

  const topIndex = useMemo(() => {
    if (scores.length < 72) {
      return -1;
    }
    let top = -1;
    let best = 0;
    for (let index = 0; index < 72; index += 1) {
      if ((scores[index] ?? 0) > best) {
        best = scores[index];
        top = index;
      }
    }
    return best > 0.01 ? top : -1;
  }, [scores]);

  const chroma = reading?.chroma?.length === 12 ? reading.chroma : Array(12).fill(0);
  const chromaMax = Math.max(0.001, ...chroma);

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.summaryLeft}>
          <Text style={styles.eyebrow}>CHORD RECOGNITION</Text>
          <Text
            style={[styles.chordName, {color: hasChord ? colors.accent : colors.textMuted}]}
            accessibilityLabel={hasChord ? `Detected chord ${chordName}` : 'No clear chord detected'}
            accessibilityLiveRegion="polite">
            {chordName}
          </Text>
          <Text style={styles.instruction}>
            {hasChord
              ? 'Sounding notes in the current analysis window'
              : view.hasSignal
                ? 'Play two or more notes together'
                : 'Play two or more notes to detect a chord'}
          </Text>
        </View>
        <View style={styles.confidenceBlock}>
          <Text style={styles.confidenceLabel}>CONFIDENCE</Text>
          <Text style={styles.confidenceValue}>
            {hasChord ? `${Math.round((reading?.chordConfidence ?? 0) * 100)}%` : '—'}
          </Text>
          <View style={styles.confidenceTrack}>
            <View
              style={[
                styles.confidenceFill,
                {
                  width: `${clamp((reading?.chordConfidence ?? 0) * 100, 0, 100)}%`,
                  backgroundColor: hasChord ? colors.accent : colors.textMuted,
                },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.chromaPanel}>
        <Text style={styles.chromaLabel}>CHROMA</Text>
        <View style={styles.chromaBars}>
          {chroma.map((value, pitchClass) => (
            <View key={`chroma-${pitchClass}`} style={styles.chromaColumn}>
              <View style={styles.chromaTrack}>
                <View
                  style={[
                    styles.chromaFill,
                    {
                      height: `${clamp((value / chromaMax) * 100, 2, 100)}%`,
                      backgroundColor:
                        reading?.chordRoot === pitchClass ? colors.accent : colors.accentDim,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.chromaNote, reading?.chordRoot === pitchClass && styles.chromaNoteActive]}>
                {noteName(pitchClass, settings.noteNameStyle)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.gridPanel}>
        <View style={styles.gridHeaderRow}>
          <View style={styles.qualityHeader} />
          {Array.from({length: 12}, (_, root) => (
            <View key={`header-${root}`} style={styles.rootHeaderCell}>
              <Text
                style={[
                  styles.rootHeaderText,
                  reading?.chordRoot === root && hasChord && styles.rootHeaderTextActive,
                ]}>
                {noteName(root, settings.noteNameStyle)}
              </Text>
            </View>
          ))}
        </View>
        {CHORD_QUALITIES.map((quality, qualityIndex) => (
          <View key={quality} style={styles.gridRow}>
            <View style={styles.qualityLabelCell}>
              <Text style={styles.qualityLabel}>{quality}</Text>
            </View>
            {Array.from({length: 12}, (_, root) => {
              const score = scores[root * 6 + qualityIndex] ?? 0;
              const isTop = topIndex === root * 6 + qualityIndex && hasChord;
              const isDetected =
                hasChord && reading?.chordRoot === root && reading?.chordQuality === quality;
              return (
                <View
                  key={`cell-${root}-${quality}`}
                  style={[
                    styles.scoreCell,
                    {
                      backgroundColor: withAlpha(
                        isDetected ? colors.accent : colors.accentDim,
                        0.04 + score * 0.58,
                      ),
                    },
                    isDetected && styles.scoreCellDetected,
                    isTop && !isDetected && styles.scoreCellTop,
                  ]}
                  accessibilityLabel={`${noteName(root, settings.noteNameStyle)} ${quality}, score ${Math.round(
                    score * 100,
                  )} percent${isDetected ? ', detected chord' : ''}`}>
                  {score >= 0.15 ? (
                    <Text
                      style={[
                        styles.scoreText,
                        score > 0.55 && styles.scoreTextStrong,
                        isDetected && styles.scoreTextDetected,
                      ]}>
                      {Math.round(score * 100)}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {view.hasSignal ? `${view.noteText} · ${view.hzText}` : 'LISTENING FOR NOTES'}
        </Text>
        <Text style={styles.footerText}>maj · min · maj7 · min7 · dom7 · dim7</Text>
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
    gap: spacing.sm,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  summaryLeft: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: colors.textMuted,
    fontFamily: type.condensed,
    fontSize: 10,
    letterSpacing: 2,
  },
  chordName: {
    fontFamily: type.condensed,
    fontWeight: '700',
    fontSize: 42,
    letterSpacing: -1,
    lineHeight: 46,
  },
  instruction: {
    color: colors.textSecondary,
    fontFamily: type.body,
    fontSize: 12,
    marginTop: -2,
  },
  confidenceBlock: {
    width: 98,
    alignItems: 'flex-end',
    gap: 2,
    paddingTop: spacing.xs,
  },
  confidenceLabel: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 8,
    letterSpacing: 1,
  },
  confidenceValue: {
    color: colors.text,
    fontFamily: type.mono,
    fontSize: 18,
  },
  confidenceTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
  chromaPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chromaLabel: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 8,
    letterSpacing: 1.5,
    transform: [{rotate: '-90deg'}],
  },
  chromaBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 54,
  },
  chromaColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    height: '100%',
  },
  chromaTrack: {
    flex: 1,
    width: '70%',
    justifyContent: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  chromaFill: {
    width: '100%',
    borderRadius: 2,
  },
  chromaNote: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 7,
  },
  chromaNoteActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  gridPanel: {
    flex: 1,
    minHeight: 196,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    backgroundColor: colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  qualityHeader: {
    width: 42,
  },
  rootHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  rootHeaderText: {
    color: colors.textSecondary,
    fontFamily: type.mono,
    fontSize: 9,
  },
  rootHeaderTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  qualityLabelCell: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  qualityLabel: {
    color: colors.textSecondary,
    fontFamily: type.mono,
    fontSize: 9,
  },
  scoreCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.grid,
  },
  scoreCellDetected: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  scoreCellTop: {
    borderWidth: 1,
    borderColor: colors.accentDim,
  },
  scoreText: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 8,
  },
  scoreTextStrong: {
    color: colors.text,
  },
  scoreTextDetected: {
    color: colors.accent,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  footerText: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 8,
  },
});
