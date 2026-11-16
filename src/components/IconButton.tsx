import React from 'react';
import {Pressable, StyleProp, StyleSheet, ViewStyle} from 'react-native';
import {colors, radii} from '../constants/theme';
import {Icon, IconName} from './Icon';

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  label: string;
  hint?: string;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  selected?: boolean;
}

export function IconButton({
  icon,
  onPress,
  label,
  hint,
  size = 20,
  color = colors.text,
  style,
  disabled,
  selected,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{disabled: !!disabled, selected: !!selected}}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        selected && styles.selected,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <Icon name={icon} size={size} color={disabled ? colors.textMuted : color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: colors.surfaceAlt,
  },
  pressed: {
    backgroundColor: colors.surfaceAlt,
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.45,
  },
});
