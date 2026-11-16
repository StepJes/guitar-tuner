import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, spacing, type} from '../constants/theme';
import {Icon, IconName} from './Icon';
import {AppButton} from './AppButton';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({icon = 'wave', title, message, actionLabel, onAction}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={30} color={colors.accentDim} />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} variant="primary" style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xs,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
  title: {
    color: colors.text,
    fontFamily: type.condensed,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontFamily: type.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 380,
  },
  action: {
    marginTop: spacing.sm,
    minWidth: 160,
  },
});
