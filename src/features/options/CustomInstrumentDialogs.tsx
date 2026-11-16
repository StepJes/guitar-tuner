import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {DialogModal} from '../../components/DialogModal';
import {AppButton} from '../../components/AppButton';
import {Icon} from '../../components/Icon';
import {colors, spacing, type} from '../../constants/theme';
import {CustomInstrument} from '../../types/settings';
import {
  MAX_NAME_LENGTH,
  makeId,
  sanitizeName,
  validateDefinitionName,
} from '../../utils/validation';
import {MIDI_MAX, MIDI_MIN, clamp, formattedNoteList, noteName} from '../../utils/notes';
import {maxCustomDefinitions} from '../../constants/presets';
import {ConfirmDialog} from './SimpleSettingDialogs';

interface ManagerProps {
  visible: boolean;
  instruments: CustomInstrument[];
  activeName: string;
  noteNameStyle: number;
  onClose: () => void;
  onLoad: (name: string) => void;
  onSave: (item: CustomInstrument, editingId?: string) => void;
  onDelete: (item: CustomInstrument) => void;
}

export function CustomInstrumentManager({
  visible,
  instruments,
  activeName,
  noteNameStyle,
  onClose,
  onLoad,
  onSave,
  onDelete,
}: ManagerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editing, setEditing] = useState<CustomInstrument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomInstrument | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const activeCustom = instruments.find(item => activeName === `!${item.name}`);
    setSelectedId(previous => {
      if (previous && instruments.some(item => item.id === previous)) {
        return previous;
      }
      return activeCustom?.id ?? null;
    });
  }, [activeName, instruments, visible]);

  const selected = instruments.find(item => item.id === selectedId) ?? null;
  const existingNames = useMemo(() => instruments.map(item => item.name), [instruments]);
  const cap = maxCustomDefinitions();

  const openNew = () => {
    setEditing(null);
    setEditorVisible(true);
  };

  const openEdit = () => {
    if (!selected) {
      return;
    }
    setEditing(selected);
    setEditorVisible(true);
  };

  const handleSaved = (item: CustomInstrument, editingId?: string) => {
    onSave(item, editingId);
    setSelectedId(item.id);
    setEditorVisible(false);
    setEditing(null);
  };

  return (
    <>
      <DialogModal
        visible={visible && !editorVisible}
        title="Custom Instruments"
        subtitle={`${instruments.length} of ${cap} saved definitions`}
        onClose={onClose}
        footer={
          <View style={styles.managerFooter}>
            <AppButton
              label="New"
              onPress={openNew}
              disabled={instruments.length >= cap}
              style={styles.managerButton}
              icon={<Icon name="plus" size={15} color={colors.text} />}
            />
            <AppButton
              label="Load"
              variant="primary"
              onPress={() => {
                if (selected) {
                  onLoad(selected.name);
                  onClose();
                }
              }}
              disabled={!selected}
              style={styles.managerButton}
            />
            <AppButton
              label="Edit"
              onPress={openEdit}
              disabled={!selected}
              style={styles.managerButton}
              icon={<Icon name="edit" size={15} color={colors.text} />}
            />
            <AppButton
              label="Delete"
              variant="danger"
              onPress={() => selected && setDeleteTarget(selected)}
              disabled={!selected}
              style={styles.managerButton}
              icon={<Icon name="trash" size={15} color={colors.danger} />}
            />
          </View>
        }>
        {instruments.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="list" size={28} color={colors.accentDim} />
            <Text style={styles.emptyTitle}>No custom instruments</Text>
            <Text style={styles.emptyText}>
              Press New to create a tuning with 2–12 strings. Preset instruments remain available
              from the Preset Instrument option.
            </Text>
          </View>
        ) : (
          instruments.map(item => {
            const isSelected = item.id === selectedId;
            const isActive = activeName === `!${item.name}`;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="radio"
                accessibilityState={{selected: isSelected}}
                accessibilityLabel={`${item.name}. ${formattedNoteList(
                  item.notes,
                  noteNameStyle,
                )}${isActive ? '. Currently active.' : ''}`}
                onPress={() => setSelectedId(item.id)}
                onLongPress={() => {
                  setEditing(item);
                  setEditorVisible(true);
                }}
                style={({pressed}) => [
                  styles.listRow,
                  isSelected && styles.listRowSelected,
                  pressed && styles.pressed,
                ]}>
                <View style={styles.listText}>
                  <View style={styles.listTitleRow}>
                    <Text
                      style={[styles.listTitle, isSelected && styles.listTitleSelected]}
                      numberOfLines={1}>
                      {item.name}
                    </Text>
                    {isActive ? <Text style={styles.activeBadge}>ACTIVE</Text> : null}
                  </View>
                  <Text style={styles.listDetail} numberOfLines={2}>
                    {formattedNoteList(item.notes, noteNameStyle)}
                  </Text>
                </View>
                {isSelected ? <Icon name="check" size={18} color={colors.accent} /> : null}
              </Pressable>
            );
          })
        )}
        {instruments.length > 0 ? (
          <Text style={styles.hint}>Tap to select. Press and hold a row to edit.</Text>
        ) : null}
      </DialogModal>

      <CustomInstrumentEditor
        visible={visible && editorVisible}
        initial={editing}
        existingNames={existingNames}
        noteNameStyle={noteNameStyle}
        onCancel={() => {
          setEditorVisible(false);
          setEditing(null);
        }}
        onSave={handleSaved}
      />

      <ConfirmDialog
        visible={Boolean(deleteTarget)}
        title="Delete custom instrument"
        message={
          deleteTarget
            ? `Delete custom instrument '${deleteTarget.name}'? This operation cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDelete(deleteTarget);
            if (selectedId === deleteTarget.id) {
              setSelectedId(null);
            }
            setDeleteTarget(null);
          }
        }}
      />
    </>
  );
}

function MiniStep({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [styles.miniStep, pressed && styles.pressed, disabled && styles.disabled]}>
      <Text style={styles.miniStepText}>{label}</Text>
    </Pressable>
  );
}

function NoteEditorRow({
  index,
  midi,
  noteNameStyle,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  midi: number;
  noteNameStyle: number;
  canRemove: boolean;
  onChange: (midi: number) => void;
  onRemove: () => void;
}) {
  const name = noteName(midi, noteNameStyle);
  const octave = Math.floor(midi / 12) - 1;
  return (
    <View style={styles.stringRow}>
      <Text style={styles.stringNumber}>{String(index + 1).padStart(2, '0')}</Text>
      <View style={styles.noteGroup}>
        <Text style={styles.segmentLabel}>NOTE</Text>
        <MiniStep
          label={`Lower string ${index + 1} by one semitone`}
          onPress={() => onChange(clamp(midi - 1, MIDI_MIN, MIDI_MAX))}
          disabled={midi <= MIDI_MIN}
        />
        <Text style={styles.noteReadout}>{name}</Text>
        <MiniStep
          label={`Raise string ${index + 1} by one semitone`}
          onPress={() => onChange(clamp(midi + 1, MIDI_MIN, MIDI_MAX))}
          disabled={midi >= MIDI_MAX}
        />
      </View>
      <View style={styles.octaveGroup}>
        <Text style={styles.segmentLabel}>OCT</Text>
        <MiniStep
          label={`Lower string ${index + 1} by one octave`}
          onPress={() => onChange(clamp(midi - 12, MIDI_MIN, MIDI_MAX))}
          disabled={midi - 12 < MIDI_MIN}
        />
        <Text style={styles.octaveReadout}>{octave}</Text>
        <MiniStep
          label={`Raise string ${index + 1} by one octave`}
          onPress={() => onChange(clamp(midi + 12, MIDI_MIN, MIDI_MAX))}
          disabled={midi + 12 > MIDI_MAX}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove string ${index + 1}`}
        disabled={!canRemove}
        onPress={onRemove}
        style={({pressed}) => [
          styles.removeButton,
          pressed && styles.pressed,
          !canRemove && styles.disabled,
        ]}>
        <Icon name="close" size={14} color={canRemove ? colors.danger : colors.textMuted} />
      </Pressable>
    </View>
  );
}

function CustomInstrumentEditor({
  visible,
  initial,
  existingNames,
  noteNameStyle,
  onCancel,
  onSave,
}: {
  visible: boolean;
  initial: CustomInstrument | null;
  existingNames: string[];
  noteNameStyle: number;
  onCancel: () => void;
  onSave: (item: CustomInstrument, editingId?: string) => void;
}) {
  const [name, setName] = useState('');
  const [rows, setRows] = useState<number[]>([69, 69]);
  const [error, setError] = useState<string | null>(null);
  const [pendingOverwrite, setPendingOverwrite] = useState<CustomInstrument | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setName(initial?.name ?? '<name>');
    setRows(initial ? [...initial.notes].reverse() : [69, 69]);
    setError(null);
    setPendingOverwrite(null);
  }, [initial, visible]);

  const save = (overwrite: boolean) => {
    const cleanName = sanitizeName(name);
    const nameError = validateDefinitionName(cleanName, [], initial?.name);
    if (nameError) {
      setError(nameError);
      return;
    }
    if (rows.length < 2 || rows.length > 12) {
      setError('An instrument must contain between 2 and 12 strings.');
      return;
    }
    if (rows.some(note => !Number.isFinite(note) || note < MIDI_MIN || note > MIDI_MAX)) {
      setError(`Every note must be between ${noteName(MIDI_MIN, noteNameStyle)}${Math.floor(MIDI_MIN / 12) - 1} and ${noteName(MIDI_MAX, noteNameStyle)}${Math.floor(MIDI_MAX / 12) - 1}.`);
      return;
    }
    const item: CustomInstrument = {
      id: initial?.id ?? makeId(),
      name: cleanName,
      notes: [...rows].reverse(),
    };
    const conflict =
      !overwrite && existingNames.some(existing => existing === cleanName && existing !== initial?.name);
    if (conflict) {
      setPendingOverwrite(item);
      return;
    }
    onSave(item, initial?.id);
  };

  const updateRow = (index: number, midi: number) => {
    setRows(current => current.map((value, rowIndex) => (rowIndex === index ? midi : value)));
    setError(null);
  };

  return (
    <>
      <DialogModal
        visible={visible}
        title={initial ? 'Edit Custom Instrument' : 'New Custom Instrument'}
        subtitle="Row 1 is the highest-pitched string"
        onClose={onCancel}
        footer={
          <View style={styles.editorFooter}>
            <AppButton label="Cancel" onPress={onCancel} style={styles.footerButton} />
            <AppButton
              label="Save"
              variant="primary"
              onPress={() => save(false)}
              style={styles.footerButton}
            />
          </View>
        }>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>NAME</Text>
          <TextInput
            accessibilityLabel="Custom instrument name"
            value={name}
            onChangeText={value => {
              setName(value.replace(/[^\x20-\x7E]/g, '').slice(0, MAX_NAME_LENGTH));
              setError(null);
            }}
            placeholder="<name>"
            placeholderTextColor={colors.textMuted}
            maxLength={MAX_NAME_LENGTH}
            selectTextOnFocus
            style={styles.nameInput}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <Text style={styles.fieldHint}>
            Printable ASCII only. Internal custom markers are hidden from this editor.
          </Text>
        </View>

        <View style={styles.preview}>
          <Text style={styles.previewLabel}>STORED LOW → HIGH</Text>
          <Text style={styles.previewValue} numberOfLines={2}>
            {formattedNoteList([...rows].reverse(), noteNameStyle)}
          </Text>
          <Text style={styles.previewMeta}>{rows.length} strings</Text>
        </View>

        <View style={styles.stringList}>
          {rows.map((midi, index) => (
            <NoteEditorRow
              key={`string-${index}`}
              index={index}
              midi={midi}
              noteNameStyle={noteNameStyle}
              canRemove={rows.length > 2}
              onChange={next => updateRow(index, next)}
              onRemove={() => {
                setRows(current => current.filter((_, rowIndex) => rowIndex !== index));
                setError(null);
              }}
            />
          ))}
        </View>

        <AppButton
          label="Add string"
          onPress={() => {
            if (rows.length < 12) {
              setRows(current => [...current, 69]);
              setError(null);
            }
          }}
          disabled={rows.length >= 12}
          icon={<Icon name="plus" size={16} color={colors.text} />}
          style={styles.addButton}
          accessibilityHint="Adds the next lower string at A4."
        />
        <Text style={styles.limitText}>2–12 strings. Maximum 100 custom instruments.</Text>
        {error ? (
          <Text style={styles.errorText} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </DialogModal>

      <ConfirmDialog
        visible={Boolean(pendingOverwrite)}
        title="Overwrite custom instrument"
        message={
          pendingOverwrite
            ? `Overwrite custom instrument '${pendingOverwrite.name}'? This operation cannot be undone.`
            : ''
        }
        confirmLabel="Overwrite"
        onCancel={() => setPendingOverwrite(null)}
        onConfirm={() => {
          if (pendingOverwrite) {
            onSave(pendingOverwrite, initial?.id);
            setPendingOverwrite(null);
          }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  managerFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    flex: 1,
  },
  managerButton: {
    flex: 1,
    minWidth: 82,
    paddingHorizontal: spacing.sm,
  },
  listRow: {
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
  listRowSelected: {
    borderColor: colors.accentDim,
    backgroundColor: 'rgba(85,227,182,0.07)',
  },
  listText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  listTitle: {
    color: colors.text,
    fontFamily: type.body,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  listTitleSelected: {
    color: colors.accent,
  },
  activeBadge: {
    color: colors.accent,
    fontFamily: type.mono,
    fontSize: 8,
    borderWidth: 1,
    borderColor: colors.accentDim,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  listDetail: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 9,
    lineHeight: 14,
  },
  hint: {
    color: colors.textMuted,
    fontFamily: type.body,
    fontSize: 10,
    textAlign: 'center',
    paddingTop: 2,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: type.condensed,
    fontSize: 19,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: type.body,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 380,
  },
  editorFooter: {
    flexDirection: 'row',
    gap: spacing.xs,
    flex: 1,
  },
  footerButton: {
    flex: 1,
  },
  fieldGroup: {
    gap: 5,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  nameInput: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.bg,
    color: colors.text,
    fontFamily: type.body,
    fontSize: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: 0,
  },
  fieldHint: {
    color: colors.textMuted,
    fontFamily: type.body,
    fontSize: 10,
  },
  preview: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.bgElevated,
    padding: spacing.sm,
    gap: 2,
  },
  previewLabel: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 8,
    letterSpacing: 1,
  },
  previewValue: {
    color: colors.accent,
    fontFamily: type.mono,
    fontSize: 12,
    lineHeight: 17,
  },
  previewMeta: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 9,
  },
  stringList: {
    gap: 5,
  },
  stringRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.bg,
    paddingHorizontal: 5,
    paddingVertical: 4,
  },
  stringNumber: {
    width: 20,
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 10,
    textAlign: 'center',
  },
  noteGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  octaveGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  segmentLabel: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 7,
    letterSpacing: 0.5,
  },
  miniStep: {
    width: 25,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: colors.surfaceAlt,
  },
  miniStepText: {
    color: colors.text,
    fontFamily: type.mono,
    fontSize: 13,
  },
  noteReadout: {
    width: 34,
    color: colors.accent,
    fontFamily: type.mono,
    fontSize: 13,
    textAlign: 'center',
  },
  octaveReadout: {
    width: 18,
    color: colors.text,
    fontFamily: type.mono,
    fontSize: 13,
    textAlign: 'center',
  },
  removeButton: {
    width: 30,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,100,100,0.35)',
    backgroundColor: 'rgba(255,100,100,0.06)',
  },
  addButton: {
    alignSelf: 'stretch',
  },
  limitText: {
    color: colors.textMuted,
    fontFamily: type.body,
    fontSize: 10,
    textAlign: 'center',
  },
  errorText: {
    color: colors.danger,
    fontFamily: type.body,
    fontSize: 12,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.35,
  },
});
