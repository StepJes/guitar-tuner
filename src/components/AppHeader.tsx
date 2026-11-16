import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, spacing, type} from '../constants/theme';
import {IconButton} from './IconButton';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onOptions?: () => void;
  onViews?: () => void;
  compact?: boolean;
}

export function AppHeader({title, subtitle, onBack, onOptions, onViews, compact}: AppHeaderProps) {
  return (
    <View style={[styles.header, compact && styles.headerCompact]}>
      <View style={styles.left}>
        {onBack ? (
          <IconButton icon="back" label="Back" onPress={onBack} style={styles.back} />
        ) : (
          <View style={styles.mark} accessibilityElementsHidden>
            <View style={styles.markBar} />
            <View style={[styles.markBar, styles.markBarShort]} />
            <View style={styles.markBar} />
          </View>
        )}
        <View style={styles.titles}>
          <Text style={styles.wordmark} accessibilityRole="header">
            {title || 'PITCHLAB'}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.actions}>
        {onViews ? (
          <IconButton
            icon="grid"
            label="Choose view"
            hint="Opens the PitchLab Views selector. You can also press and hold the tuner."
            onPress={onViews}
          />
        ) : null}
        {onOptions ? (
          <IconButton
            icon="gear"
            label="Options"
            hint="Open tuning, display and input options."
            onPress={onOptions}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 56,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerCompact: {
    minHeight: 48,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  mark: {
    width: 22,
    height: 30,
    justifyContent: 'center',
    gap: 4,
    marginRight: spacing.xs,
    paddingLeft: spacing.xxs,
  },
  markBar: {
    height: 3,
    backgroundColor: colors.accent,
    borderRadius: 2,
    width: 18,
  },
  markBarShort: {
    width: 12,
    backgroundColor: colors.flat,
  },
  titles: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.xxs,
  },
  wordmark: {
    color: colors.text,
    fontFamily: type.wordmark,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 3.2,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: type.condensed,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  back: {
    marginRight: spacing.xxs,
  },
});
