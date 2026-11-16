import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import {colors, radii, spacing, type} from '../constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityHint?: string;
}

export function AppButton({
  label,
  onPress,
  variant = 'secondary',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  accessibilityHint,
}: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{disabled: disabled || loading}}
      disabled={disabled || loading}
      onPress={onPress}
      style={({pressed}) => [
        styles.base,
        styles[variant],
        pressed && !disabled && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? colors.bg : colors.accent} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              variant === 'primary' && styles.primaryLabel,
              variant === 'danger' && styles.dangerLabel,
              (disabled || loading) && styles.disabledLabel,
              textStyle,
            ]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: 'rgba(255,100,100,0.10)',
    borderColor: 'rgba(255,100,100,0.55)',
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: colors.text,
    fontFamily: type.body,
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  primaryLabel: {
    color: '#03100C',
  },
  dangerLabel: {
    color: colors.danger,
  },
  disabledLabel: {
    color: colors.textMuted,
  },
});
