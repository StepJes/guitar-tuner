import React, {useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Screen} from '../components/Screen';
import {AppHeader} from '../components/AppHeader';
import {StatusBanner} from '../components/StatusBanner';
import {OptionRow, SectionHeader} from '../components/OptionRow';
import {HelpDialog} from '../features/options/HelpDialog';
import {
  A4Dialog,
  AnalysisRateDialog,
  CompatibilityDialog,
  DebuggingDialog,
  DisplaySettingsDialog,
  FactoryResetDialog,
  SampleRateDialog,
} from '../features/options/SimpleSettingDialogs';
import {
  PresetInstrumentDialog,
  PresetTemperamentDialog,
} from '../features/options/PresetPickerDialogs';
import {CustomInstrumentManager} from '../features/options/CustomInstrumentDialogs';
import {CustomTemperamentManager} from '../features/options/CustomTemperamentDialogs';
import {colors, spacing, type} from '../constants/theme';
import {
  ANALYSIS_RATES,
  DEFAULT_INSTRUMENT,
  DEFAULT_TEMPERAMENT,
  ORIENTATIONS,
} from '../constants/presets';
import {useSettings} from '../services/SettingsContext';
import {
  CustomInstrument,
  CustomTemperament,
} from '../types/settings';
import {
  customName,
  displayDefinitionName,
  isCustomName,
  replaceById,
  replaceTemperament,
  resolveInstrument,
  resolveTemperament,
} from '../utils/validation';
import {setRequestedOrientation} from '../native/PitchLabAudio';
import type {RootStackParamList} from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Options'>;

type DialogName =
  | 'help'
  | 'presetInstrument'
  | 'customInstrument'
  | 'presetTemperament'
  | 'customTemperament'
  | 'a4'
  | 'sampleRate'
  | 'analysisRate'
  | 'display'
  | 'compatibility'
  | 'debugging'
  | 'factoryReset'
  | null;

function activeCustomName(name: string): string | null {
  return isCustomName(name) ? name.slice(1) : null;
}

function analysisLabel(rate: number): string {
  return ANALYSIS_RATES.find(item => item.value === rate)?.label ?? 'Medium';
}

function orientationLabel(value: number): string {
  return ORIENTATIONS.find(item => item.value === value)?.label ?? 'Dynamic';
}

export function OptionsScreen({navigation}: Props) {
  const {
    settings,
    loaded,
    update,
    reset,
    storageWarning,
    clearStorageWarning,
  } = useSettings();
  const [dialog, setDialog] = useState<DialogName>(null);

  const instrument = useMemo(() => resolveInstrument(settings), [settings]);
  const temperament = useMemo(() => resolveTemperament(settings), [settings]);
  const activeInstrumentCustom = activeCustomName(settings.instrumentName);
  const activeTemperamentCustom = activeCustomName(settings.temperamentName);

  const handleSaveInstrument = (item: CustomInstrument, editingId?: string) => {
    const editing = settings.customInstruments.find(entry => entry.id === editingId);
    const renamedActive =
      Boolean(editing) && activeInstrumentCustom === editing?.name && editing?.name !== item.name;
    update({
      customInstruments: replaceById(settings.customInstruments, item, editingId),
      ...(renamedActive ? {instrumentName: customName(item.name)} : {}),
    });
  };

  const handleDeleteInstrument = (item: CustomInstrument) => {
    const wasActive = activeInstrumentCustom === item.name;
    update({
      customInstruments: settings.customInstruments.filter(entry => entry.id !== item.id),
      ...(wasActive ? {instrumentName: DEFAULT_INSTRUMENT} : {}),
    });
  };

  const handleSaveTemperament = (item: CustomTemperament, editingId?: string) => {
    const editing = settings.customTemperaments.find(entry => entry.id === editingId);
    const renamedActive =
      Boolean(editing) &&
      activeTemperamentCustom === editing?.name &&
      editing?.name !== item.name;
    update({
      customTemperaments: replaceTemperament(settings.customTemperaments, item, editingId),
      ...(renamedActive ? {temperamentName: customName(item.name)} : {}),
    });
  };

  const handleDeleteTemperament = (item: CustomTemperament) => {
    const wasActive = activeTemperamentCustom === item.name;
    update({
      customTemperaments: settings.customTemperaments.filter(entry => entry.id !== item.id),
      ...(wasActive ? {temperamentName: DEFAULT_TEMPERAMENT} : {}),
    });
  };

  return (
    <Screen>
      <View style={styles.root}>
        <AppHeader
          title="OPTIONS"
          subtitle="Tuning, display, audio and diagnostics"
          onBack={() => navigation.goBack()}
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator>
          {storageWarning ? (
            <View style={styles.bannerWrap}>
              <StatusBanner
                tone="warning"
                message={storageWarning}
                onDismiss={clearStorageWarning}
              />
            </View>
          ) : null}

          <View style={styles.intro}>
            <Text style={styles.introTitle}>PitchLab configuration</Text>
            <Text style={styles.introText}>
              Preset and input changes apply immediately. Editors and display compatibility use OK
              or Cancel. Audio is paused while this screen is open.
            </Text>
          </View>

          <SectionHeader
            title="Information"
            description="Instructions, troubleshooting guidance and version history."
          />
          <OptionRow
            title="Help"
            description="Quick start, visualization modes, compatibility, credits, support and release notes."
            value="1.0.22"
            onPress={() => setDialog('help')}
          />

          <SectionHeader
            title="Instrument"
            description="Choose the string layout used by the instrument view and target matching."
          />
          <OptionRow
            title="Preset Instrument"
            description={
              activeInstrumentCustom
                ? `Custom instrument “${activeInstrumentCustom}” is active.`
                : `${instrument.notes.length} strings · ${settings.instrumentName}`
            }
            value={activeInstrumentCustom ? 'Custom active' : settings.instrumentName}
            onPress={() => setDialog('presetInstrument')}
          />
          <OptionRow
            title="Custom Instruments"
            description="Create, edit, load or delete user-defined string layouts (2–12 strings)."
            value={`${settings.customInstruments.length} saved`}
            onPress={() => setDialog('customInstrument')}
          />

          <SectionHeader
            title="Temperament"
            description="Choose historic tuning offsets or a user-defined twelve-note temperament."
          />
          <OptionRow
            title="Preset Temperament"
            description={
              activeTemperamentCustom
                ? `Custom temperament “${activeTemperamentCustom}” is active.`
                : 'Equal, meantone, Pythagorean, Kirnberger, Valotti and Young temperaments.'
            }
            value={activeTemperamentCustom ? 'Custom active' : settings.temperamentName}
            onPress={() => setDialog('presetTemperament')}
          />
          <OptionRow
            title="Custom Temperaments"
            description="Create, edit, load or delete twelve-offset temperaments."
            value={`${settings.customTemperaments.length} saved`}
            onPress={() => setDialog('customTemperament')}
          />

          <SectionHeader
            title="Tuning"
            description="Reference pitch shared by every instrument and temperament."
          />
          <OptionRow
            title="A4 Frequency"
            description="Text entry or ±0.1 / ±1.0 Hz step buttons. Range 220.0–880.0 Hz."
            value={`${settings.a4Reference.toFixed(1)} Hz`}
            onPress={() => setDialog('a4')}
          />

          <SectionHeader
            title="Audio Input"
            description="Applied immediately. The microphone engine restarts on the tuner."
          />
          <OptionRow
            title="Sample Rate"
            description="Lower rates reduce processor use and the analysed frequency range."
            value={`${settings.sampleRate / 1000} kHz`}
            onPress={() => setDialog('sampleRate')}
          />
          <OptionRow
            title="Analysis Rate"
            description="How frequently pitch, spectrum and chord estimates are recalculated."
            value={analysisLabel(settings.analysisRate)}
            onPress={() => setDialog('analysisRate')}
          />

          <SectionHeader
            title="Display"
            description="Notation, in-tune tolerance and device orientation."
          />
          <OptionRow
            title="Display Settings"
            description="Note naming, in-tune threshold and screen orientation lock."
            value={`${settings.noteNameStyle === 0 ? 'Sharps' : 'Flats'} · ${
              settings.inTuneThreshold
            }¢ · ${orientationLabel(settings.screenOrientation)}`}
            onPress={() => setDialog('display')}
          />

          <SectionHeader
            title="Compatibility"
            description="Fallbacks for graphics and legacy audio behaviour."
          />
          <OptionRow
            title="Compatibility"
            description="Spectrogram texture format, audio setup version and audio analysis version."
            value={`${settings.audioSetupVersion} · ${settings.audioAnalysisVersion} · ${
              settings.texTypeSpectrogram === 4 ? '5551' : '8888'
            }`}
            onPress={() => setDialog('compatibility')}
          />

          <SectionHeader
            title="Troubleshooting"
            description="Temporarily disable subsystems to isolate a problem."
          />
          <OptionRow
            title="Debugging"
            description="Audio input, visualization drawing and texture toggles."
            value={
              settings.debugMask === 0
                ? 'All enabled'
                : `${3 - [1, 2, 4].filter(bit => (settings.debugMask & bit) !== 0).length} of 3 enabled`
            }
            onPress={() => setDialog('debugging')}
          />

          <SectionHeader
            title="Reset"
            description="Restore defaults without deleting custom definitions."
          />
          <OptionRow
            title="Factory Reset"
            description="Reset settings, view usage and welcome state. Custom instruments and temperaments are retained."
            value="Defaults"
            destructive
            onPress={() => setDialog('factoryReset')}
          />

          <View style={styles.footer}>
            <Text style={styles.footerTitle}>PITCHLAB LITE 1.0.22</Text>
            <Text style={styles.footerText}>
              Independent React Native recreation · {instrument.name} ·{' '}
              {displayDefinitionName(temperament.name)} · A4 {settings.a4Reference.toFixed(1)} Hz
            </Text>
            <Text style={styles.footerText}>
              Loaded {loaded ? 'settings ready' : 'defaults while storage loads'} · Active view{' '}
              {settings.viewMode + 1} of 5
            </Text>
          </View>
        </ScrollView>
      </View>

      <HelpDialog visible={dialog === 'help'} onClose={() => setDialog(null)} />

      <PresetInstrumentDialog
        visible={dialog === 'presetInstrument'}
        currentName={settings.instrumentName}
        noteNameStyle={settings.noteNameStyle}
        onClose={() => setDialog(null)}
        onSelect={name => {
          update({instrumentName: name});
          setDialog(null);
        }}
      />

      <CustomInstrumentManager
        visible={dialog === 'customInstrument'}
        instruments={settings.customInstruments}
        activeName={settings.instrumentName}
        noteNameStyle={settings.noteNameStyle}
        onClose={() => setDialog(null)}
        onLoad={name => {
          update({instrumentName: customName(name)});
          setDialog(null);
        }}
        onSave={handleSaveInstrument}
        onDelete={handleDeleteInstrument}
      />

      <PresetTemperamentDialog
        visible={dialog === 'presetTemperament'}
        currentName={settings.temperamentName}
        onClose={() => setDialog(null)}
        onSelect={name => {
          update({temperamentName: name});
          setDialog(null);
        }}
      />

      <CustomTemperamentManager
        visible={dialog === 'customTemperament'}
        temperaments={settings.customTemperaments}
        activeName={settings.temperamentName}
        noteNameStyle={settings.noteNameStyle}
        onClose={() => setDialog(null)}
        onLoad={name => {
          update({temperamentName: customName(name)});
          setDialog(null);
        }}
        onSave={handleSaveTemperament}
        onDelete={handleDeleteTemperament}
      />

      <A4Dialog
        visible={dialog === 'a4'}
        value={settings.a4Reference}
        onClose={() => setDialog(null)}
        onCommit={value => update({a4Reference: value})}
      />

      <SampleRateDialog
        visible={dialog === 'sampleRate'}
        value={settings.sampleRate}
        onClose={() => setDialog(null)}
        onCommit={value => update({sampleRate: value})}
      />

      <AnalysisRateDialog
        visible={dialog === 'analysisRate'}
        value={settings.analysisRate}
        onClose={() => setDialog(null)}
        onCommit={value => update({analysisRate: value})}
      />

      <DisplaySettingsDialog
        visible={dialog === 'display'}
        value={{
          noteNameStyle: settings.noteNameStyle,
          inTuneThreshold: settings.inTuneThreshold,
          screenOrientation: settings.screenOrientation,
        }}
        onClose={() => setDialog(null)}
        onCommit={value => {
          update(value);
          setRequestedOrientation(value.screenOrientation);
        }}
      />

      <CompatibilityDialog
        visible={dialog === 'compatibility'}
        value={{
          texTypeSpectrogram: settings.texTypeSpectrogram,
          audioSetupVersion: settings.audioSetupVersion,
          audioAnalysisVersion: settings.audioAnalysisVersion,
        }}
        onClose={() => setDialog(null)}
        onCommit={value => update(value)}
      />

      <DebuggingDialog
        visible={dialog === 'debugging'}
        mask={settings.debugMask}
        onClose={() => setDialog(null)}
        onCommit={mask => update({debugMask: mask})}
      />

      <FactoryResetDialog
        visible={dialog === 'factoryReset'}
        onClose={() => setDialog(null)}
        onConfirm={() => {
          reset();
          setDialog(null);
          navigation.goBack();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  bannerWrap: {
    paddingTop: spacing.xs,
  },
  intro: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 4,
    backgroundColor: colors.bgElevated,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  introTitle: {
    color: colors.text,
    fontFamily: type.condensed,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  introText: {
    color: colors.textSecondary,
    fontFamily: type.body,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerTitle: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  footerText: {
    color: colors.textMuted,
    fontFamily: type.body,
    fontSize: 11,
    lineHeight: 16,
  },
});
