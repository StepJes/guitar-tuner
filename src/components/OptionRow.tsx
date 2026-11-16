import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {colors, spacing, type} from '../constants/theme';
import {Icon} from './Icon';

interface OptionRowProps {
  title: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  selected?: boolean;
  rightIcon?: React.ReactNode;
}

export function OptionRow({
  title,
  description,
  value,
  onPress,
  destructive,
  disabled,
  showChevron = true,
  selected,
  rightIcon,
}: OptionRowProps) {
  const content = (
    <>
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, destructive && styles.destructive, disabled && styles.disabled]}>
            {title}
          </Text>
          {value ? (
            <Text style={styles.value} numberOfLines={1}>
              {value}
            </Text>
          ) : null}
        </View>
        {description ? (
          <Text style={[styles.description, disabled && styles.disabled]}>{description}</Text>
        ) : null}
      </View>
      {rightIcon}
      {selected ? <Icon name="check" size={20} color={colors.accent} /> : null}
      {showChevron && onPress ? (
        <Icon name="chevron" size={16} color={disabled ? colors.textMuted : colors.textSecondary} />
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={{disabled: !!disabled, selected: !!selected}}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [styles.row, pressed && styles.pressed, disabled && styles.rowDisabled]}>
      {content}
    </Pressable>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
}

export function SectionHeader({title, description}: SectionHeaderProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.surfaceAlt,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  title: {
    color: colors.text,
    fontFamily: type.body,
    fontWeight: '500',
    fontSize: 18,
    flexShrink: 1,
  },
  destructive: {
    color: colors.danger,
  },
  disabled: {
    color: colors.textMuted,
  },
  value: {
    color: colors.accent,
    fontFamily: type.mono,
    fontSize: 12,
    marginLeft: 'auto',
    maxWidth: '46%',
  },
  description: {
    color: colors.textSecondary,
    fontFamily: type.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  section: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: type.body,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  sectionDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
