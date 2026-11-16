import {chordDisplayName, presentReading} from '../src/features/tuner/reading';
import {DEFAULT_SETTINGS} from '../src/utils/validation';
import {TunerReading} from '../src/types/audio';
import {Settings} from '../src/types/settings';

const reading = (overrides: Partial<TunerReading> = {}): TunerReading => ({
  frequency: 440,
  midi: 69,
  cents: 0,
  confidence: 0.95,
  rms: 0.2,
  noteName: 'A',
  stringIndex: 0,
  spectrum: [],
  chroma: [],
  waveform: [],
  chordRoot: 9,
  chordQuality: 'maj',
  chordName: 'Amaj',
  chordConfidence: 0.8,
  chordScores: [],
  timestamp: Date.now(),
  sampleRate: 44100,
  sessionId: 1,
  ...overrides,
});

describe('tuner reading presentation', () => {
  test('shows a silent listening state with no fake values', () => {
    const shown = presentReading(null, DEFAULT_SETTINGS);
    expect(shown.hasSignal).toBe(false);
    expect(shown.noteText).toBe('—');
    expect(shown.statusText).toBe('LISTENING');
    expect(shown.direction).toBe('none');
    expect(shown.centsText).toBe('—');
    expect(shown.hzText).toBe('— Hz');
    expect(shown.targetHz).toBe(0);
  });

  test('shows an in-tune reading within the configured threshold', () => {
    const shown = presentReading(reading({cents: 4.9}), DEFAULT_SETTINGS);
    expect(shown.hasSignal).toBe(true);
    expect(shown.noteText).toBe('A4');
    expect(shown.inTune).toBe(true);
    expect(shown.statusText).toBe('IN TUNE!');
    expect(shown.direction).toBe('tuned');
    expect(shown.hzText).toBe('440.0 Hz');
  });

  test('distinguishes flat and sharp readings', () => {
    const flat = presentReading(reading({cents: -12}), DEFAULT_SETTINGS);
    expect(flat.direction).toBe('flat');
    expect(flat.statusText).toBe('TUNE UP');

    const sharp = presentReading(reading({cents: 12}), DEFAULT_SETTINGS);
    expect(sharp.direction).toBe('sharp');
    expect(sharp.statusText).toBe('TUNE DOWN');
  });

  test('respects note style and temperament target frequency', () => {
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      noteNameStyle: 1,
      temperamentName: '!Tempered',
      customTemperaments: [{id: 't', name: 'Tempered', cents: Array(12).fill(10)}],
    };
    const shown = presentReading(reading({midi: 61, frequency: 277.18, cents: 0}), settings);
    expect(shown.noteText).toBe('Db4');
    expect(shown.targetHz).toBeCloseTo(277.18 * Math.pow(2, 10 / 1200), 2);
  });

  test('formats chord display names', () => {
    expect(chordDisplayName(9, 'min7', 0)).toBe('Amin7');
    expect(chordDisplayName(1, 'maj', 1)).toBe('Dbmaj');
    expect(chordDisplayName(-1, 'maj', 0)).toBe('—');
    expect(chordDisplayName(9, '', 0)).toBe('—');
  });
});
