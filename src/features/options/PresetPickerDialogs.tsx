import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {DialogModal} from '../../components/DialogModal';
import {AppButton} from '../../components/AppButton';
import {Icon} from '../../components/Icon';
import {colors, spacing, type} from '../../constants/theme';
import {PRESET_INSTRUMENTS, PRESET_TEMPERAMENTS} from '../../constants/presets';
import {formattedNoteList} from '../../utils/notes';
import {displayDefinitionName} from '../../utils/validation';

function selectionRow(
  key: string,
  title: string,
  detail: string,
  selected: boolean,
  onPress: () => void,
  trailing?: string,
) {
  return (
    <Pressable
      key={key}
      accessibilityRole="radio"
      accessibilityState={{selected}}
      accessibilityLabel={`${title}. ${detail}`}
      onPress={onPress}
      style={({pressed}) => [styles.row, selected && styles.rowSelected, pressed && styles.pressed]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, selected && styles.rowTitleSelected]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.rowDetail} numberOfLines={2}>
          {detail}
        </Text>
      </View>
      {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
      {selected ? <Icon name="check" size={18} color={colors.accent} /> : null}
    </Pressable>
  );
}

export function PresetInstrumentDialog({
  visible,
  currentName,
  noteNameStyle,
  onClose,
  onSelect,
}: {
  visible: boolean;
  currentName: string;
  noteNameStyle: number;
  onClose: () => void;
  onSelect: (name: string) => void;
}) {
  return (
    <DialogModal
      visible={visible}
      title="Preset Instrument"
      subtitle={`${PRESET_INSTRUMENTS.length} built-in tunings`}
      onClose={onClose}
      footer={<AppButton label="Close" onPress={onClose} style={styles.footerButton} />}>
      {PRESET_INSTRUMENTS.map(instrument =>
        selectionRow(
          instrument.name,
          instrument.name,
          formattedNoteList(instrument.notes, noteNameStyle),
          currentName === instrument.name,
          () => onSelect(instrument.name),
          `${instrument.notes.length} str`,
        ),
      )}
    </DialogModal>
  );
}

export function formatTemperamentOffsets(cents: readonly number[]): string {
  return cents.map(value => `${value >= 0 ? '+' : ''}${value.toFixed(1)}`).join('  ');
}

export function PresetTemperamentDialog({
  visible,
  currentName,
  onClose,
  onSelect,
}: {
  visible: boolean;
  currentName: string;
  onClose: () => void;
  onSelect: (name: string) => void;
}) {
  return (
    <DialogModal
      visible={visible}
      title="Preset Temperament"
      subtitle={`${PRESET_TEMPERAMENTS.length} historic and equal temperaments`}
      onClose={onClose}
      footer={<AppButton label="Close" onPress={onClose} style={styles.footerButton} />}>
      {PRESET_TEMPERAMENTS.map(temperament =>
        selectionRow(
          temperament.name,
          temperament.name,
          `C through B: ${formatTemperamentOffsets(temperament.cents)}`,
          currentName === temperament.name,
          () => onSelect(temperament.name),
        ),
      )}
      <Text style={styles.note}>
        Offsets are shown in cents relative to equal temperament. Custom definitions are managed
        separately.
      </Text>
    </DialogModal>
  );
}

export function CustomDefinitionSummary({name}: {name: string}) {
  return <Text style={styles.rowDetail}>{displayDefinitionName(name)}</Text>;
}

const styles = StyleSheet.create({
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  rowSelected: {
    borderColor: colors.accentDim,
    backgroundColor: 'rgba(85,227,182,0.07)',
  },
  pressed: {
    opacity: 0.72,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTitle: {
    color: colors.text,
    fontFamily: type.body,
    fontSize: 14,
    fontWeight: '600',
  },
  rowTitleSelected: {
    color: colors.accent,
  },
  rowDetail: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 9,
    lineHeight: 14,
  },
  trailing: {
    color: colors.textSecondary,
    fontFamily: type.mono,
    fontSize: 9,
  },
  footerButton: {
    flex: 1,
  },
  note: {
    color: colors.textMuted,
    fontFamily: type.body,
    fontSize: 11,
    lineHeight: 16,
  },
});
