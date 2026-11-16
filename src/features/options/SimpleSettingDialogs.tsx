import React, {useEffect, useState} from 'react';
import {StyleSheet, Switch, Text, View} from 'react-native';
import {DialogModal} from '../../components/DialogModal';
import {AppButton} from '../../components/AppButton';
import {NumericStepper} from '../../components/NumericStepper';
import {Icon} from '../../components/Icon';
import {colors, spacing, type} from '../../constants/theme';
import {
  ANALYSIS_RATES,
  AUDIO_ANALYSIS_VERSIONS,
  AUDIO_SETUP_VERSIONS,
  IN_TUNE_THRESHOLDS,
  ORIENTATIONS,
  SAMPLE_RATES,
} from '../../constants/presets';
import {DialogSectionLabel, OptionChoice} from './OptionChoice';
import {
  AudioAnalysisVersion,
  AudioSetupVersion,
  AnalysisRate,
  NoteNameStyle,
  ScreenOrientationSetting,
  SampleRate,
  SpectrogramTexture,
} from '../../types/settings';
import {
  DEFAULT_A4,
  MAX_A4,
  MIN_A4,
  displayDefinitionName,
  sanitizeA4,
} from '../../utils/validation';

export function A4Dialog({
  visible,
  value,
  onClose,
  onCommit,
}: {
  visible: boolean;
  value: number;
  onClose: () => void;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (visible) {
      setDraft(sanitizeA4(value));
    }
  }, [value, visible]);

  return (
    <DialogModal
      visible={visible}
      title="A4 Frequency"
      subtitle="Reference pitch for the entire tuning system"
      onClose={onClose}
      scroll={false}
      footer={
        <View style={styles.footerRow}>
          <AppButton
            label="Reset"
            onPress={() => setDraft(DEFAULT_A4)}
            style={styles.footerButton}
            icon={<Icon name="reset" size={16} color={colors.text} />}
          />
          <AppButton label="Cancel" onPress={onClose} style={styles.footerButton} />
          <AppButton
            label="OK"
            variant="primary"
            onPress={() => {
              onCommit(sanitizeA4(draft));
              onClose();
            }}
            style={styles.footerButton}
          />
        </View>
      }>
      <View style={styles.stack}>
        <NumericStepper
          value={draft}
          onChange={setDraft}
          min={MIN_A4}
          max={MAX_A4}
          smallStep={0.1}
          bigStep={1}
          decimals={1}
          unit="Hz"
          label="A4 reference"
        />
        <Text style={styles.helpText}>
          All instrument note targets and temperament offsets are calculated from this pitch.
          Valid range: {MIN_A4.toFixed(1)}–{MAX_A4.toFixed(1)} Hz. Reset changes the draft only until
          OK is pressed.
        </Text>
        <View style={styles.presetRow}>
          {[415, 432, 440, 442, 444, 466].map(frequency => (
            <AppButton
              key={frequency}
              label={frequency.toFixed(1)}
              onPress={() => setDraft(frequency)}
              style={styles.presetButton}
              textStyle={styles.presetText}
              variant={Math.abs(draft - frequency) < 0.05 ? 'primary' : 'secondary'}
            />
          ))}
        </View>
      </View>
    </DialogModal>
  );
}

export function SampleRateDialog({
  visible,
  value,
  onClose,
  onCommit,
}: {
  visible: boolean;
  value: SampleRate;
  onClose: () => void;
  onCommit: (value: SampleRate) => void;
}) {
  return (
    <DialogModal
      visible={visible}
      title="Sample Rate"
      subtitle="Applied immediately; microphone analysis restarts"
      onClose={onClose}
      footer={<AppButton label="Close" onPress={onClose} style={styles.footerButton} />}>
      <DialogSectionLabel
        title="Microphone sample rate"
        description="Lower rates reduce CPU and battery use but also reduce the highest frequency that can be analysed. If the microphone cannot open at the selected rate, choose another rate."
      />
      <OptionChoice
        value={value}
        options={SAMPLE_RATES.map(rate => ({
          value: rate,
          label: `${rate / 1000} kHz`,
          description:
            rate === 44100
              ? '44,100 samples/second. Full-range default; highest CPU use.'
              : rate === 22050
                ? '22,050 samples/second. Recommended when displays feel slow.'
                : rate === 11025
                  ? '11,025 samples/second. Lower CPU, limited high-frequency range.'
                  : '8,000 samples/second. Lowest CPU and narrowest range.',
        }))}
        onChange={rate => {
          onCommit(rate);
          onClose();
        }}
      />
    </DialogModal>
  );
}

export function AnalysisRateDialog({
  visible,
  value,
  onClose,
  onCommit,
}: {
  visible: boolean;
  value: AnalysisRate;
  onClose: () => void;
  onCommit: (value: AnalysisRate) => void;
}) {
  return (
    <DialogModal
      visible={visible}
      title="Analysis Rate"
      subtitle="How often pitch and spectrum data are calculated"
      onClose={onClose}
      footer={<AppButton label="Close" onPress={onClose} style={styles.footerButton} />}>
      <OptionChoice
        value={value}
        options={ANALYSIS_RATES.map(rate => ({...rate}))}
        onChange={rate => {
          onCommit(rate);
          onClose();
        }}
      />
      <Text style={styles.helpText}>
        High analysis provides the fastest visual response. Medium is the default. Low reduces
        processor use and may make strobe motion less fluid.
      </Text>
    </DialogModal>
  );
}

export interface DisplayDraft {
  noteNameStyle: NoteNameStyle;
  inTuneThreshold: 5 | 10 | 15;
  screenOrientation: ScreenOrientationSetting;
}

export function DisplaySettingsDialog({
  visible,
  value,
  onClose,
  onCommit,
}: {
  visible: boolean;
  value: DisplayDraft;
  onClose: () => void;
  onCommit: (value: DisplayDraft) => void;
}) {
  const [draft, setDraft] = useState<DisplayDraft>(value);
  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [value, visible]);

  return (
    <DialogModal
      visible={visible}
      title="Display Settings"
      subtitle="Note names, in-tune tolerance and orientation"
      onClose={onClose}
      footer={
        <View style={styles.footerRow}>
          <AppButton label="Cancel" onPress={onClose} style={styles.footerButton} />
          <AppButton
            label="OK"
            variant="primary"
            onPress={() => {
              onCommit(draft);
              onClose();
            }}
            style={styles.footerButton}
          />
        </View>
      }>
      <DialogSectionLabel
        title="Note naming"
        description="Applies to tuner readings, preset lists and custom definition editors."
      />
      <OptionChoice
        value={draft.noteNameStyle}
        options={[
          {value: 0 as const, label: 'Sharps', description: 'C, C♯, D, D♯, E, F, F♯, G, G♯, A, A♯, B'},
          {value: 1 as const, label: 'Flats', description: 'C, D♭, D, E♭, E, F, G♭, G, A♭, A, B♭, B'},
        ]}
        onChange={noteNameStyle => setDraft(current => ({...current, noteNameStyle}))}
      />

      <DialogSectionLabel
        title="In-tune threshold"
        description="The maximum deviation still shown as in tune. Strobe locking uses this value."
      />
      <OptionChoice
        value={draft.inTuneThreshold}
        options={IN_TUNE_THRESHOLDS.map(option => ({...option}))}
        onChange={inTuneThreshold => setDraft(current => ({...current, inTuneThreshold}))}
      />

      <DialogSectionLabel
        title="Screen orientation"
        description="Dynamic follows the device sensor. A lock is applied when the tuner becomes active."
      />
      <OptionChoice
        value={draft.screenOrientation}
        options={ORIENTATIONS.map(option => ({...option}))}
        onChange={screenOrientation => setDraft(current => ({...current, screenOrientation}))}
      />
    </DialogModal>
  );
}

export interface CompatibilityDraft {
  texTypeSpectrogram: SpectrogramTexture;
  audioSetupVersion: AudioSetupVersion;
  audioAnalysisVersion: AudioAnalysisVersion;
}

export function CompatibilityDialog({
  visible,
  value,
  onClose,
  onCommit,
}: {
  visible: boolean;
  value: CompatibilityDraft;
  onClose: () => void;
  onCommit: (value: CompatibilityDraft) => void;
}) {
  const [draft, setDraft] = useState<CompatibilityDraft>(value);
  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [value, visible]);

  return (
    <DialogModal
      visible={visible}
      title="Compatibility"
      subtitle="Renderer and legacy audio analysis switches"
      onClose={onClose}
      footer={
        <View style={styles.footerRow}>
          <AppButton label="Cancel" onPress={onClose} style={styles.footerButton} />
          <AppButton
            label="OK"
            variant="primary"
            onPress={() => {
              onCommit(draft);
              onClose();
            }}
            style={styles.footerButton}
          />
        </View>
      }>
      <DialogSectionLabel
        title="Spectrogram texture"
        description="Change this only if Spectrogram or calibration markers are misaligned on your device."
      />
      <OptionChoice
        value={draft.texTypeSpectrogram}
        options={[
          {
            value: 5 as const,
            label: 'RGBA-8888',
            description: 'Default 32-bit texture. Highest colour precision.',
          },
          {
            value: 4 as const,
            label: 'RGBA-5551',
            description: '16-bit fallback for graphics compatibility problems.',
          },
        ]}
        onChange={texTypeSpectrogram =>
          setDraft(current => ({...current, texTypeSpectrogram}))
        }
      />

      <DialogSectionLabel
        title="Audio setup"
        description="Legacy microphone-open behaviour. Latest is recommended; try another version if audio input fails."
      />
      <OptionChoice
        value={draft.audioSetupVersion}
        options={AUDIO_SETUP_VERSIONS.map(version => ({
          value: version,
          label: version === 'Latest' ? 'Latest (recommended)' : version,
          description:
            version === 'Latest'
              ? 'Current microphone capture and recovery behaviour.'
              : version === '1.0.7'
                ? 'Audio setup from app version 1.0.7.'
                : 'Original audio setup from app version 1.0.0.',
        }))}
        onChange={audioSetupVersion => setDraft(current => ({...current, audioSetupVersion}))}
      />

      <DialogSectionLabel
        title="Audio analysis"
        description="Legacy analysis is useful when bass instruments are not tracked reliably."
      />
      <OptionChoice
        value={draft.audioAnalysisVersion}
        options={AUDIO_ANALYSIS_VERSIONS.map(version => ({
          value: version,
          label: version === 'Latest' ? 'Latest (recommended)' : version,
          description:
            version === 'Latest'
              ? 'Bass-extended analysis introduced in 1.0.16.'
              : 'Pre-1.0.16 analysis behaviour.',
        }))}
        onChange={audioAnalysisVersion =>
          setDraft(current => ({...current, audioAnalysisVersion}))
        }
      />
    </DialogModal>
  );
}

function DebugSwitchRow({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchText}>
        <Text style={styles.switchTitle}>{title}</Text>
        <Text style={styles.switchDescription}>{description}</Text>
      </View>
      <Switch
        accessibilityLabel={title}
        value={enabled}
        onValueChange={onToggle}
        trackColor={{false: colors.surfaceAlt, true: 'rgba(85,227,182,0.38)'}}
        thumbColor={enabled ? colors.accent : colors.textMuted}
        ios_backgroundColor={colors.surfaceAlt}
      />
    </View>
  );
}

export function DebuggingDialog({
  visible,
  mask,
  onClose,
  onCommit,
}: {
  visible: boolean;
  mask: number;
  onClose: () => void;
  onCommit: (mask: number) => void;
}) {
  const [draft, setDraft] = useState(mask);
  useEffect(() => {
    if (visible) {
      setDraft(mask);
    }
  }, [mask, visible]);

  const setBit = (bit: number, enabled: boolean) => {
    setDraft(current => (enabled ? current & ~bit : current | bit));
  };

  return (
    <DialogModal
      visible={visible}
      title="Debugging"
      subtitle="Isolate display or audio problems"
      onClose={onClose}
      footer={
        <View style={styles.footerRow}>
          <AppButton label="Cancel" onPress={onClose} style={styles.footerButton} />
          <AppButton
            label="OK"
            variant="primary"
            onPress={() => {
              onCommit(draft);
              onClose();
            }}
            style={styles.footerButton}
          />
        </View>
      }>
      <Text style={styles.helpText}>
        Turn functions off to identify a problem. Audio analysis cannot run while audio input is
        disabled. These switches are intended for troubleshooting, not normal tuning.
      </Text>
      <DebugSwitchRow
        title="Audio input"
        description="Capture microphone samples and calculate pitch, spectrum and chord data."
        enabled={(draft & 1) === 0}
        onToggle={enabled => setBit(1, enabled)}
      />
      <DebugSwitchRow
        title="Visualizations"
        description="Draw the selected tuner view. Disable to test audio without graphics."
        enabled={(draft & 2) === 0}
        onToggle={enabled => setBit(2, enabled)}
      />
      <DebugSwitchRow
        title="Textures"
        description="Use the spectrogram texture palette. Disable for a flat diagnostic display."
        enabled={(draft & 4) === 0}
        onToggle={enabled => setBit(4, enabled)}
      />
    </DialogModal>
  );
}

export function FactoryResetDialog({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <DialogModal
      visible={visible}
      title="Factory Reset"
      onClose={onClose}
      scroll={false}
      footer={
        <View style={styles.footerRow}>
          <AppButton label="Cancel" onPress={onClose} style={styles.footerButton} />
          <AppButton
            label="Reset"
            variant="danger"
            onPress={onConfirm}
            style={styles.footerButton}
            icon={<Icon name="warning" size={16} color={colors.danger} />}
          />
        </View>
      }>
      <View style={styles.confirmBody}>
        <Icon name="warning" size={34} color={colors.warning} />
        <Text style={styles.confirmLead}>
          Reset all settings to their defaults, select the Instrument view and show the welcome help
          again?
        </Text>
        <Text style={styles.confirmDetail}>
          Your custom instruments and custom temperaments are retained. A4, sample rate, analysis,
          compatibility, display, orientation, debugging, view usage and welcome state return to
          defaults.
        </Text>
      </View>
    </DialogModal>
  );
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Delete',
  destructive = true,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <DialogModal
      visible={visible}
      title={title}
      onClose={onCancel}
      scroll={false}
      footer={
        <View style={styles.footerRow}>
          <AppButton label="Cancel" onPress={onCancel} style={styles.footerButton} />
          <AppButton
            label={confirmLabel}
            variant={destructive ? 'danger' : 'primary'}
            onPress={onConfirm}
            style={styles.footerButton}
          />
        </View>
      }>
      <View style={styles.confirmBody}>
        <Icon
          name={destructive ? 'warning' : 'info'}
          size={32}
          color={destructive ? colors.danger : colors.accent}
        />
        <Text style={styles.confirmLead}>{message}</Text>
      </View>
    </DialogModal>
  );
}

export function activeDefinitionLabel(name: string, custom: boolean): string {
  return custom ? `${displayDefinitionName(name)} (custom)` : name;
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flex: 1,
    flexWrap: 'wrap',
  },
  footerButton: {
    flex: 1,
    minWidth: 96,
  },
  helpText: {
    color: colors.textSecondary,
    fontFamily: type.body,
    fontSize: 12,
    lineHeight: 18,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  presetButton: {
    paddingHorizontal: spacing.sm,
    minWidth: 68,
    flex: 1,
  },
  presetText: {
    fontSize: 12,
  },
  switchRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.bg,
    padding: spacing.sm,
  },
  switchText: {
    flex: 1,
    gap: 2,
  },
  switchTitle: {
    color: colors.text,
    fontFamily: type.body,
    fontSize: 14,
    fontWeight: '600',
  },
  switchDescription: {
    color: colors.textMuted,
    fontFamily: type.body,
    fontSize: 11,
    lineHeight: 16,
  },
  confirmBody: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  confirmLead: {
    color: colors.text,
    fontFamily: type.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  confirmDetail: {
    color: colors.textMuted,
    fontFamily: type.body,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
