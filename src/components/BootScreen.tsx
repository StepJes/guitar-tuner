import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {colors, spacing, type} from '../constants/theme';

export function BootScreen({message = 'Loading settings'}: {message?: string}) {
  return (
    <View style={styles.root} accessibilityRole="progressbar" accessibilityLabel="PitchLab is starting">
      <View style={styles.mark}>
        <View style={styles.markBar} />
        <View style={[styles.markBar, styles.markShort]} />
        <View style={styles.markBar} />
      </View>
      <Text style={styles.wordmark}>PITCHLAB</Text>
      <Text style={styles.lite}>LITE</Text>
      <View style={styles.rule} />
      <Text style={styles.tagline}>CHROMATIC / INSTRUMENT TUNER</Text>
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} size="small" />
        <Text style={styles.message}>{message}</Text>
      </View>
      <Text style={styles.version}>VERSION 1.0.22</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  mark: {
    width: 66,
    height: 58,
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  markBar: {
    height: 6,
    width: 62,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  markShort: {
    width: 38,
    backgroundColor: colors.flat,
  },
  wordmark: {
    color: colors.text,
    fontFamily: type.condensed,
    fontSize: 46,
    fontWeight: '700',
    letterSpacing: 7,
    lineHeight: 50,
  },
  lite: {
    color: colors.accent,
    fontFamily: type.mono,
    fontSize: 11,
    letterSpacing: 9,
    marginTop: 1,
  },
  rule: {
    width: 124,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  tagline: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 8,
    letterSpacing: 1.6,
    textAlign: 'center',
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxl,
  },
  message: {
    color: colors.textSecondary,
    fontFamily: type.body,
    fontSize: 13,
  },
  version: {
    position: 'absolute',
    bottom: spacing.xl,
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 8,
    letterSpacing: 1.3,
  },
});
