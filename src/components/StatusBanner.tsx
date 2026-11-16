import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {colors, spacing, type} from '../constants/theme';
import {Icon, IconName} from './Icon';

interface StatusBannerProps {
  message: string;
  tone?: 'info' | 'warning' | 'danger' | 'success';
  icon?: IconName;
  onDismiss?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

export function StatusBanner({
  message,
  tone = 'info',
  icon,
  onDismiss,
  actionLabel,
  onAction,
}: StatusBannerProps) {
  const toneColor =
    tone === 'danger'
      ? colors.danger
      : tone === 'warning'
        ? colors.warning
        : tone === 'success'
          ? colors.accent
          : colors.flat;
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, {borderColor: `${toneColor}66`, backgroundColor: `${toneColor}14`}]}>
      <Icon
        name={icon || (tone === 'danger' || tone === 'warning' ? 'warning' : 'info')}
        size={18}
        color={toneColor}
      />
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({pressed}) => [styles.action, pressed && styles.pressed]}>
          <Text style={[styles.actionText, {color: toneColor}]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
      {onDismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss message"
          onPress={onDismiss}
          hitSlop={8}
          style={({pressed}) => [styles.dismiss, pressed && styles.pressed]}>
          <Icon name="close" size={15} color={toneColor} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  message: {
    color: colors.text,
    fontFamily: type.body,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  action: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dismiss: {
    padding: 4,
  },
  pressed: {
    opacity: 0.65,
  },
});
