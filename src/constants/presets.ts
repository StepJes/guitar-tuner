import {parseNoteList} from '../utils/notes';

export interface PresetInstrument {
  name: string;
  notes: number[];
}

export interface PresetTemperament {
  name: string;
  cents: number[];
}

const instrumentSource: Array<[string, string]> = [
  ['Guitar, Standard', 'E2 A2 D3 G3 B3 E4'],
  ['Guitar, Drop D', 'D2 A2 D3 G3 B3 E4'],
  ['Guitar, Open D', 'D2 A2 D3 F#3 A3 D4'],
  ['Guitar, Open G', 'D2 G2 D3 G3 B3 D4'],
  ['Guitar, Open A', 'E2 A2 E3 A3 C#4 E4'],
  ['Guitar, Lute', 'E2 A2 D3 F#3 B3 E4'],
  ['Guitar, Irish', 'D2 A2 D3 G3 A3 D4'],
  ['Bass Guitar, (4 String), Standard', 'E1 A1 D2 G2'],
  ['Bass Guitar, (5 String), Low B', 'B0 E1 A1 D2 G2'],
  ['Bass Guitar, (5 String), Low E', 'E1 A1 D2 G2 C3'],
  ['Bass Guitar, (6 String), Standard', 'B0 E1 A1 D2 G2 C3'],
  ['Violin', 'G3 D4 A4 E5'],
  ['Violin (Tenor)', 'G2 D3 A3 E4'],
  ['Viola', 'C3 G3 D4 A4'],
  ['Fiddle, Standard', 'G3 D4 A4 E5'],
  ['Fiddle, Cajun', 'F3 C4 G4 D5'],
  ['Fiddle, Open G', 'G3 D4 G4 B4'],
  ['Fiddle, Sawmill', 'G3 D4 G4 D5'],
  ['Fiddle, Gee-dad', 'G3 D4 A4 D5'],
  ['Fiddle, Open D', 'D3 D4 A4 D5'],
  ['Fiddle, High bass', 'A3 D4 A4 E5'],
  ['Fiddle, Cross tuning', 'A3 E4 A4 E5'],
  ['Fiddle, Calico', 'A3 E4 A4 C#5'],
  ['Mandolin', 'G3 G3 D4 D4 A4 A4 E5 E5'],
  ['Mandolin (Octave)', 'G2 G2 D3 D3 A3 A3 E4 E4'],
  ['Ukulele (Concert), Standard', 'G4 C4 E4 A4'],
  ['Ukulele (Concert), D6/Soprano', 'A4 D4 F#4 B4'],
  ['Ukulele (Tenor)', 'G3 C4 E4 A4'],
  ['Ukulele (Baritone)', 'D3 G3 B3 E4'],
  ['Ukulele (Bass)', 'E1 A1 D2 G2'],
  ['Banjo (5 string), Standard/Open G', 'G4 D3 G3 B3 D4'],
  ['Banjo (5 string), C tuning', 'G4 C3 G3 B3 D4'],
  ['Banjo (5 string), Double C', 'G4 C3 G3 C4 D4'],
  ['Banjo (5 string), Sawmill', 'G4 D3 G3 C4 D4'],
  ['Banjo (5 string), Open D', 'F#4 D3 F#3 A3 D4'],
  ['Banjo (5 string), Guitar', 'G4 D3 G3 B3 E4'],
  ['Banjo (5 string), Willie Moore', 'G4 D3 G3 A3 D4'],
  ['Banjo (5 string), Dock Boggs (Low C)', 'F#4 C3 G3 A3 D4'],
  ['Banjo (5 string), Dock Boggs (Low D)', 'F#4 D3 G3 A3 D4'],
  ['Banjo (5 string), Cumberland Gap', 'G4 E3 A3 D4 E4'],
  ['Banjo (5 string), G Minor', 'G4 D3 G3 A#3 D4'],
  ['Banjo (5 string), Open C', 'G4 C3 G3 C4 E4'],
  ['Banjo (Plectrum)', 'C3 G3 B3 D4'],
  ['Banjo (Tenor), Standard', 'C3 G3 D4 A4'],
  ['Banjo (Tenor), Irish', 'G2 D3 A3 E4'],
  ['Banjo (Long neck)', 'G4 B2 E3 G#3 B3'],
  ['Bouzouki (8 string)', 'C3 C4 F3 F4 A3 A3 D4 D4'],
  ['Bouzouki (6 string)', 'D3 D4 A3 A3 D4 D4'],
  ['Pedal Steel, Standard/E9th', 'B2 D3 E3 F#3 G#3 B3 E4 G#4 D#4 F#4'],
  ['Pedal Steel, C6th', 'C2 F2 A2 C3 E3 G3 A3 C4 E4 D4'],
  ['Pedal Steel, A7th', 'A1 E2 G2 A2 C#3 E3 G3 A3 C#4 E4'],
  ['Pedal Steel, C Diatonic', 'G2 A2 C3 E3 F3 G3 A3 B3 C4 E4'],
];

export const PRESET_INSTRUMENTS: PresetInstrument[] = instrumentSource.map(([name, notes]) => ({
  name,
  notes: parseNoteList(notes),
}));

export const PRESET_TEMPERAMENTS: PresetTemperament[] = [
  {name: 'Equal Tempered (Perfect Octave)', cents: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]},
  {name: 'Equal Tempered (Perfect Fifth)', cents: [-2.5, -2.2, -2.0, -1.7, -1.4, -1.1, -0.8, -0.6, -0.3, 0, 0.3, 0.6]},
  {name: 'Kirnberger I', cents: [15.6, 5.9, 19.6, 9.8, 2.0, 13.7, 5.9, 17.6, 7.8, 0, 11.7, 3.9]},
  {name: 'Kirnberger IIa', cents: [4.9, -4.9, 8.8, -1.0, -8.8, 2.9, -4.9, 6.8, -2.9, 0, 1.0, -6.8]},
  {name: 'Kirnberger IIb', cents: [5.9, -3.9, 9.8, 0, -9.8, 3.9, -5.9, 7.8, -2.0, 0, 2.0, -7.8]},
  {name: 'Kirnberger III', cents: [10.3, 0.5, 3.4, 4.4, -3.4, 8.3, 0.5, 6.8, 2.4, 0, 6.4, -1.5]},
  {name: 'Meantone', cents: [8.8, -9.8, 2.9, 15.6, -2.9, 11.7, -7.8, 5.9, -10.8, 0, 13.7, -5.9]},
  {name: 'Meantone (#, -1/4)', cents: [10.3, -13.7, 3.4, -20.5, -3.4, 13.7, -10.3, 6.8, -17.1, 0, -24.0, -6.8]},
  {name: 'Meantone (b, -1/4)', cents: [10.3, 27.4, 3.4, 20.5, -3.4, 13.7, 30.8, 6.8, 24.0, 0, 17.1, -6.8]},
  {name: 'Meantone (Homogeneous)', cents: [7.0, -9.4, 2.3, 14.1, -2.3, 9.4, -7.0, 4.7, -11.7, 0, 11.7, -4.7]},
  {name: 'Meantone (Homogeneous third)', cents: [12.6, -16.8, 4.2, 25.1, -4.2, 16.8, -12.6, 8.4, -21.0, 0, 21.0, -8.4]},
  {name: 'Meantone (Homogeneous gradated)', cents: [4.9, -6.5, 1.6, 9.8, -1.6, 6.5, -4.9, 3.3, -8.1, 0, 8.1, -3.3]},
  {name: 'Pythagorean', cents: [-5.9, 7.8, -2.0, -11.7, 2.0, -7.8, 5.9, -3.9, 9.8, 0, -9.8, 3.9]},
  {name: 'Pythagorean (Perfect)', cents: [15.6, 7.8, 19.6, 11.7, 2.0, 13.7, 5.9, 17.6, 9.8, 0, 11.7, 3.9]},
  {name: 'Valotti', cents: [5.9, 0, 2.0, 3.9, -2.0, 7.8, -2.0, 3.9, 2.0, 0, 5.9, -3.9]},
  {name: 'Young I', cents: [5.9, 0, 2.0, 3.9, -2.0, 5.9, -2.0, 3.9, 2.0, 0, 5.9, -2.0]},
  {name: 'Young II', cents: [5.9, -3.9, 2.0, 0, -2.0, 3.9, -5.9, 3.9, -2.0, 0, 2.0, -3.9]},
];

export const DEFAULT_INSTRUMENT = PRESET_INSTRUMENTS[0].name;
export const DEFAULT_TEMPERAMENT = PRESET_TEMPERAMENTS[0].name;
export const EQUAL_TEMPERAMENT_CENTS = PRESET_TEMPERAMENTS[0].cents;

export const SAMPLE_RATES = [44100, 22050, 11025, 8000] as const;
export const ANALYSIS_RATES = [
  {value: 1 as const, label: 'High', description: 'Fastest visual response, highest battery use.'},
  {value: 0 as const, label: 'Medium', description: 'Balanced response and battery use.'},
  {value: -1 as const, label: 'Low', description: 'Slowest visual response, lowest battery use.'},
];
export const IN_TUNE_THRESHOLDS = [
  {value: 5 as const, label: '5 cents', description: 'Strict, studio-style in-tune window.'},
  {value: 10 as const, label: '10 cents', description: 'Balanced in-tune window.'},
  {value: 15 as const, label: '15 cents', description: 'Relaxed in-tune window.'},
];
export const ORIENTATIONS = [
  {value: 0 as const, label: 'Dynamic', description: 'Follow the device rotation sensor.'},
  {value: 1 as const, label: 'Landscape', description: 'Lock the tuner in landscape.'},
  {value: 2 as const, label: 'Portrait', description: 'Lock the tuner in portrait.'},
];
export const AUDIO_SETUP_VERSIONS = ['1.0.0', '1.0.7', 'Latest'] as const;
export const AUDIO_ANALYSIS_VERSIONS = ['1.0.15', 'Latest'] as const;
export const VIEW_NAMES = ['Instrument', 'Dial & Strobe', 'Spectrogram', 'Chords', 'BigStrobe'] as const;
export const CHORD_QUALITIES = ['maj', 'min', 'maj7', 'min7', 'dom7', 'dim7'] as const;

export function maxCustomDefinitions(): number {
  return 100;
}
