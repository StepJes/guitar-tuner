import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, spacing, type} from '../constants/theme';
import {VIEW_NAMES} from '../constants/presets';
import {DialogModal} from './DialogModal';
import {OptionRow} from './OptionRow';

interface ViewSelectorProps {
  visible: boolean;
  currentView: number;
  onClose: () => void;
  onSelect: (index: number) => void;
  onOptions: () => void;
}

export function ViewSelector({visible, currentView, onClose, onSelect, onOptions}: ViewSelectorProps) {
  return (
    <DialogModal visible={visible} title="PitchLab Views" onClose={onClose} scroll={false}>
      <View style={styles.list}>
        {VIEW_NAMES.map((name, index) => (
          <OptionRow
            key={name}
            title={`${index + 1}. ${name}`}
            selected={currentView === index}
            showChevron={false}
            onPress={() => {
              onSelect(index);
              onClose();
            }}
          />
        ))}
      </View>
      <View style={styles.separator} />
      <OptionRow title="Options" onPress={onOptions} />
      <Text style={styles.hint}>
        Swipe the tuner left or right to move between views. Press and hold the display to open this
        menu.
      </Text>
    </DialogModal>
  );
}

const styles = StyleSheet.create({
  list: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  separator: {
    height: spacing.xs,
  },
  hint: {
    color: colors.textMuted,
    fontFamily: type.body,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
