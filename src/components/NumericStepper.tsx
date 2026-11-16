import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {colors, radii, spacing, type} from '../constants/theme';
import {clamp, roundTo} from '../utils/notes';

interface NumericStepperProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  smallStep?: number;
  bigStep?: number;
  decimals?: number;
  unit?: string;
  label?: string;
  compact?: boolean;
}

export function NumericStepper({
  value,
  onChange,
  min,
  max,
  smallStep = 0.1,
  bigStep = 1,
  decimals = 1,
  unit,
  label,
  compact = false,
}: NumericStepperProps) {
  const [text, setText] = useState(value.toFixed(decimals));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) {
      setText(value.toFixed(decimals));
    }
  }, [value, decimals, editing]);

  const parsedText = () => {
    const parsed = Number(text.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  };

  const changeText = (nextText: string) => {
    setText(nextText);
    const parsed = Number(nextText.replace(',', '.'));
    if (Number.isFinite(parsed)) {
      onChange(roundTo(clamp(parsed, min, max), decimals));
    }
  };

  const commit = () => {
    const parsed = parsedText();
    if (parsed === null) {
      setText(value.toFixed(decimals));
      return;
    }
    const next = roundTo(clamp(parsed, min, max), decimals);
    setText(next.toFixed(decimals));
    onChange(next);
  };

  const nudge = (delta: number) => {
    const next = roundTo(clamp(value + delta, min, max), decimals);
    setText(next.toFixed(decimals));
    onChange(next);
  };

  const button = (labelText: string, delta: number, accessibilityLabel: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => nudge(delta)}
      disabled={(delta < 0 && value <= min) || (delta > 0 && value >= max)}
      style={({pressed}) => [
        styles.stepButton,
        compact && styles.stepButtonCompact,
        pressed && styles.pressed,
        ((delta < 0 && value <= min) || (delta > 0 && value >= max)) && styles.disabled,
      ]}>
      <Text style={[styles.stepText, compact && styles.stepTextCompact]}>{labelText}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.controls}>
        {button('−1', -bigStep, `Decrease ${label || 'value'} by ${bigStep}`)}
        {button('−.1', -smallStep, `Decrease ${label || 'value'} by ${smallStep}`)}
        <View style={[styles.inputWrap, compact && styles.inputWrapCompact]}>
          <TextInput
            accessibilityLabel={label ? `${label} value` : 'Numeric value'}
            style={[styles.input, compact && styles.inputCompact]}
            value={text}
            onChangeText={changeText}
            onFocus={() => setEditing(true)}
            onSubmitEditing={commit}
            onBlur={() => {
              setEditing(false);
              commit();
            }}
            keyboardType="decimal-pad"
            selectTextOnFocus
            maxLength={8}
          />
          {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        </View>
        {button('+.1', smallStep, `Increase ${label || 'value'} by ${smallStep}`)}
        {button('+1', bigStep, `Increase ${label || 'value'} by ${bigStep}`)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  compactContainer: {
    gap: 4,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: type.body,
    fontSize: 12,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepButton: {
    minWidth: 44,
    minHeight: 42,
    paddingHorizontal: 6,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonCompact: {
    minWidth: 32,
    minHeight: 32,
    paddingHorizontal: 3,
    flexShrink: 1,
  },
  stepText: {
    color: colors.text,
    fontFamily: type.mono,
    fontSize: 14,
    fontWeight: '600',
  },
  stepTextCompact: {
    fontSize: 10,
  },
  inputWrap: {
    flex: 1,
    minWidth: 86,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xs,
  },
  inputWrapCompact: {
    minWidth: 70,
  },
  input: {
    flex: 1,
    minHeight: 42,
    color: colors.accent,
    fontFamily: type.mono,
    fontSize: 17,
    textAlign: 'center',
    paddingVertical: 0,
  },
  inputCompact: {
    minHeight: 32,
    fontSize: 13,
  },
  unit: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 11,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.35,
  },
});
