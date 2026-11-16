import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {DialogModal} from '../../components/DialogModal';
import {AppButton} from '../../components/AppButton';
import {Icon} from '../../components/Icon';
import {NumericStepper} from '../../components/NumericStepper';
import {colors, spacing, type} from '../../constants/theme';
import {CustomTemperament} from '../../types/settings';
import {
  MAX_NAME_LENGTH,
  MAX_TEMPERAMENT_CENTS,
  MIN_TEMPERAMENT_CENTS,
  makeId,
  sanitizeName,
  sanitizeTemperamentCents,
  validateDefinitionName,
} from '../../utils/validation';
import {noteName} from '../../utils/notes';
import {maxCustomDefinitions} from '../../constants/presets';
import {ConfirmDialog} from './SimpleSettingDialogs';
import {formatTemperamentOffsets} from './PresetPickerDialogs';

interface ManagerProps {
  visible: boolean;
  temperaments: CustomTemperament[];
  activeName: string;
  noteNameStyle: number;
  onClose: () => void;
  onLoad: (name: string) => void;
  onSave: (item: CustomTemperament, editingId?: string) => void;
  onDelete: (item: CustomTemperament) => void;
}

export function CustomTemperamentManager({
  visible,
  temperaments,
  activeName,
  noteNameStyle,
  onClose,
  onLoad,
  onSave,
  onDelete,
}: ManagerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editing, setEditing] = useState<CustomTemperament | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomTemperament | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const activeCustom = temperaments.find(item => activeName === `!${item.name}`);
    setSelectedId(previous => {
      if (previous && temperaments.some(item => item.id === previous)) {
        return previous;
      }
      return activeCustom?.id ?? null;
    });
  }, [activeName, temperaments, visible]);

  const selected = temperaments.find(item => item.id === selectedId) ?? null;
  const existingNames = useMemo(() => temperaments.map(item => item.name), [temperaments]);
  const cap = maxCustomDefinitions();

  const handleSaved = (item: CustomTemperament, editingId?: string) => {
    onSave(item, editingId);
    setSelectedId(item.id);
    setEditorVisible(false);
    setEditing(null);
  };

  return (
    <>
      <DialogModal
        visible={visible && !editorVisible}
        title="Custom Temperaments"
        subtitle={`${temperaments.length} of ${cap} saved definitions`}
        onClose={onClose}
        footer={
          <View style={styles.managerFooter}>
            <AppButton
              label="New"
              onPress={() => {
                setEditing(null);
                setEditorVisible(true);
              }}
              disabled={temperaments.length >= cap}
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
              onPress={() => {
                if (selected) {
                  setEditing(selected);
                  setEditorVisible(true);
                }
              }}
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
        {temperaments.length === 0 ? (
          <View style={styles.empty}>
            <Icon name="list" size={28} color={colors.accentDim} />
            <Text style={styles.emptyTitle}>No custom temperaments</Text>
            <Text style={styles.emptyText}>
              Press New to define twelve pitch-class offsets in cents. Preset temperaments remain
              available from the Preset Temperament option.
            </Text>
          </View>
        ) : (
          temperaments.map(item => {
            const isSelected = item.id === selectedId;
            const isActive = activeName === `!${item.name}`;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="radio"
                accessibilityState={{selected: isSelected}}
                accessibilityLabel={`${item.name}. Offsets ${formatTemperamentOffsets(
                  item.cents,
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
                    {formatTemperamentOffsets(item.cents)} ¢
                  </Text>
                </View>
                {isSelected ? <Icon name="check" size={18} color={colors.accent} /> : null}
              </Pressable>
            );
          })
        )}
        {temperaments.length > 0 ? (
          <Text style={styles.hint}>Tap to select. Press and hold a row to edit.</Text>
        ) : null}
      </DialogModal>

      <CustomTemperamentEditor
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
        title="Delete custom temperament"
        message={
          deleteTarget
            ? `Delete custom temperament '${deleteTarget.name}'? This operation cannot be undone.`
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

function CustomTemperamentEditor({
  visible,
  initial,
  existingNames,
  noteNameStyle,
  onCancel,
  onSave,
}: {
  visible: boolean;
  initial: CustomTemperament | null;
  existingNames: string[];
  noteNameStyle: number;
  onCancel: () => void;
  onSave: (item: CustomTemperament, editingId?: string) => void;
}) {
  const [name, setName] = useState('');
  const [cents, setCents] = useState<number[]>(Array(12).fill(0));
  const [opening, setOpening] = useState<number[]>(Array(12).fill(0));
  const [error, setError] = useState<string | null>(null);
  const [pendingOverwrite, setPendingOverwrite] = useState<CustomTemperament | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const values = sanitizeTemperamentCents(initial?.cents ?? Array(12).fill(0));
    setName(initial?.name ?? '<name>');
    setCents(values);
    setOpening(values);
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
    const values = sanitizeTemperamentCents(cents);
    if (values.length !== 12) {
      setError('A temperament must contain twelve offsets.');
      return;
    }
    const item: CustomTemperament = {
      id: initial?.id ?? makeId(),
      name: cleanName,
      cents: values,
    };
    const conflict =
      !overwrite && existingNames.some(existing => existing === cleanName && existing !== initial?.name);
    if (conflict) {
      setPendingOverwrite(item);
      return;
    }
    onSave(item, initial?.id);
  };

  return (
    <>
      <DialogModal
        visible={visible}
        title={initial ? 'Edit Custom Temperament' : 'New Custom Temperament'}
        subtitle="Twelve offsets in cents, C through B"
        onClose={onCancel}
        footer={
          <View style={styles.editorFooter}>
            <AppButton
              label="Reset"
              onPress={() => {
                setCents([...opening]);
                setError(null);
              }}
              style={styles.footerButton}
              icon={<Icon name="reset" size={16} color={colors.text} />}
            />
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
            accessibilityLabel="Custom temperament name"
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
            Printable ASCII only. Offsets are applied to every octave of the selected pitch class.
          </Text>
        </View>

        <View style={styles.offsetList}>
          {cents.map((value, pitchClass) => (
            <View key={`offset-${pitchClass}`} style={styles.offsetRow}>
              <View style={styles.pitchLabel}>
                <Text style={styles.pitchName}>{noteName(pitchClass, noteNameStyle)}</Text>
                <Text style={styles.pitchIndex}>{String(pitchClass + 1).padStart(2, '0')}</Text>
              </View>
              <View style={styles.stepperWrap}>
                <NumericStepper
                  value={value}
                  onChange={next => {
                    setCents(current =>
                      current.map((entry, index) => (index === pitchClass ? next : entry)),
                    );
                    setError(null);
                  }}
                  min={MIN_TEMPERAMENT_CENTS}
                  max={MAX_TEMPERAMENT_CENTS}
                  smallStep={0.1}
                  bigStep={1}
                  decimals={1}
                  compact
                />
              </View>
              <Text style={styles.centsMark}>¢</Text>
            </View>
          ))}
        </View>
        <Text style={styles.limitText}>
          Each offset is clamped to −35.0 to +35.0 cents and rounded to one decimal. Reset restores
          the values present when this editor opened.
        </Text>
        {error ? (
          <Text style={styles.errorText} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </DialogModal>

      <ConfirmDialog
        visible={Boolean(pendingOverwrite)}
        title="Overwrite custom temperament"
        message={
          pendingOverwrite
            ? `Overwrite custom temperament '${pendingOverwrite.name}'? This operation cannot be undone.`
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
    flexWrap: 'wrap',
  },
  footerButton: {
    flex: 1,
    minWidth: 82,
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
  offsetList: {
    gap: 5,
  },
  offsetRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.bg,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  pitchLabel: {
    width: 36,
    alignItems: 'center',
  },
  pitchName: {
    color: colors.accent,
    fontFamily: type.mono,
    fontSize: 12,
    fontWeight: '700',
  },
  pitchIndex: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 7,
  },
  stepperWrap: {
    flex: 1,
    minWidth: 0,
  },
  centsMark: {
    width: 12,
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 10,
  },
  limitText: {
    color: colors.textMuted,
    fontFamily: type.body,
    fontSize: 10,
    lineHeight: 15,
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
});
