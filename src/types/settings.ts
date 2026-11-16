export type AnalysisRate = -1 | 0 | 1;
export type NoteNameStyle = 0 | 1;
export type ScreenOrientationSetting = 0 | 1 | 2;
export type SpectrogramTexture = 4 | 5;
export type SampleRate = 44100 | 22050 | 11025 | 8000;
export type AudioSetupVersion = '1.0.0' | '1.0.7' | 'Latest';
export type AudioAnalysisVersion = '1.0.15' | 'Latest';

export interface CustomInstrument {
  id: string;
  name: string;
  /** MIDI note numbers, low string to high string. */
  notes: number[];
}

export interface CustomTemperament {
  id: string;
  name: string;
  /** Twelve cent offsets, C through B. */
  cents: number[];
}

export interface Settings {
  viewMode: number;
  sampleRate: SampleRate;
  analysisRate: AnalysisRate;
  a4Reference: number;
  instrumentName: string;
  temperamentName: string;
  texTypeSpectrogram: SpectrogramTexture;
  noteNameStyle: NoteNameStyle;
  inTuneThreshold: 5 | 10 | 15;
  screenOrientation: ScreenOrientationSetting;
  usageMask: number;
  audioSetupVersion: AudioSetupVersion;
  audioAnalysisVersion: AudioAnalysisVersion;
  /** bit 0 audio input (0 = enabled), bit 1 visualisations, bit 2 textures */
  debugMask: number;
  welcomeShown: boolean;
  customInstruments: CustomInstrument[];
  customTemperaments: CustomTemperament[];
}

export interface PersistedEnvelope {
  schemaVersion: 1;
  settings: Settings;
}

export interface InstrumentDefinition {
  name: string;
  notes: number[];
  custom: boolean;
}

export interface TemperamentDefinition {
  name: string;
  cents: number[];
  custom: boolean;
}
