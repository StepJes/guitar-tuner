import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {colors, spacing, type} from '../../constants/theme';
import {Icon} from '../../components/Icon';

export interface Choice<T> {
  value: T;
  label: string;
  description?: string;
}

interface OptionChoiceProps<T> {
  title?: string;
  description?: string;
  options: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: 1 | 2 | 3;
}

export function DialogSectionLabel({title, description}: {title: string; description?: string}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
    </View>
  );
}

export function OptionChoice<T extends string | number>({
  title,
  description,
  options,
  value,
  onChange,
  columns = 1,
}: OptionChoiceProps<T>) {
  return (
    <View style={styles.group}>
      {title ? (
        <View style={styles.groupHeader}>
          <Text style={styles.groupTitle}>{title}</Text>
          {description ? <Text style={styles.groupDescription}>{description}</Text> : null}
        </View>
      ) : null}
      <View style={[styles.options, columns > 1 && styles.optionsColumns]}>
        {options.map(option => {
          const selected = option.value === value;
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole="radio"
              accessibilityState={{selected}}
              accessibilityLabel={option.label}
              accessibilityHint={option.description}
              onPress={() => onChange(option.value)}
              style={({pressed}) => [
                styles.option,
                columns > 1 && {width: `${100 / columns - 2}%`},
                selected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {option.label}
                </Text>
                {option.description ? (
                  <Text style={styles.optionDescription}>{option.description}</Text>
                ) : null}
              </View>
              {selected ? <Icon name="check" size={18} color={colors.accent} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 2,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: type.condensed,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  sectionDescription: {
    color: colors.textMuted,
    fontFamily: type.body,
    fontSize: 11,
    lineHeight: 16,
  },
  group: {
    gap: 6,
  },
  groupHeader: {
    gap: 1,
  },
  groupTitle: {
    color: colors.text,
    fontFamily: type.body,
    fontSize: 14,
    fontWeight: '600',
  },
  groupDescription: {
    color: colors.textMuted,
    fontFamily: type.body,
    fontSize: 11,
    lineHeight: 16,
  },
  options: {
    gap: 5,
  },
  optionsColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  optionSelected: {
    borderColor: colors.accentDim,
    backgroundColor: 'rgba(85,227,182,0.08)',
  },
  optionPressed: {
    opacity: 0.72,
  },
  optionText: {
    flex: 1,
    gap: 1,
  },
  optionLabel: {
    color: colors.text,
    fontFamily: type.body,
    fontSize: 14,
  },
  optionLabelSelected: {
    color: colors.accent,
    fontWeight: '600',
  },
  optionDescription: {
    color: colors.textMuted,
    fontFamily: type.body,
    fontSize: 11,
    lineHeight: 15,
  },
});
