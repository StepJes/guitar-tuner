import {PRESET_INSTRUMENTS, PRESET_TEMPERAMENTS, maxCustomDefinitions} from '../src/constants/presets';
import {
  DEFAULT_A4,
  DEFAULT_SETTINGS,
  customName,
  displayDefinitionName,
  isCustomName,
  resetSettingsPreservingCustom,
  replaceById,
  replaceTemperament,
  resolveInstrument,
  resolveTemperament,
  sanitizeA4,
  sanitizeInstrumentNotes,
  sanitizeName,
  sanitizeSettings,
  sanitizeTemperamentCents,
  validateDefinitionName,
} from '../src/utils/validation';

const instrument = (name: string, id = name) => ({id, name, notes: [40, 45, 50, 55, 59, 64]});
const temperament = (name: string, id = name) => ({id, name, cents: Array(12).fill(0)});

describe('settings validation and custom definitions', () => {
  test('sanitizes printable names and enforces limits', () => {
    expect(sanitizeName('  My\u0000   Tuning  ')).toBe('My Tuning');
    expect(sanitizeName('Café')).toBe('Caf');
    expect(sanitizeName('x'.repeat(120))).toHaveLength(100);
    expect(sanitizeName(null)).toBe('');
  });

  test('validates instrument note arrays', () => {
    expect(sanitizeInstrumentNotes([40, 45])).toEqual([40, 45]);
    expect(sanitizeInstrumentNotes([40])).toEqual([]);
    expect(sanitizeInstrumentNotes([-100, 500])).toEqual([12, 120]);
    expect(sanitizeInstrumentNotes([40, 45, 50, 55, 59, 64, 69, 74, 79, 83, 88, 93, 98])).toHaveLength(12);
  });

  test('clamps and pads temperament cents', () => {
    expect(sanitizeTemperamentCents([100, -100, 1.234])).toEqual([
      35,
      -35,
      1.2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ]);
  });

  test('sanitizes A4 and falls back on invalid values', () => {
    expect(sanitizeA4(432.14)).toBe(432.1);
    expect(sanitizeA4(100)).toBe(220);
    expect(sanitizeA4(1000)).toBe(880);
    expect(sanitizeA4('not a number')).toBe(DEFAULT_A4);
  });

  test('repairs corrupt settings and ignores invalid custom entries', () => {
    const settings = sanitizeSettings({
      viewMode: 99,
      sampleRate: 123,
      analysisRate: 4,
      a4Reference: 432.16,
      texTypeSpectrogram: 7,
      noteNameStyle: 3,
      inTuneThreshold: 7,
      screenOrientation: 9,
      usageMask: 99,
      audioSetupVersion: 'bad',
      audioAnalysisVersion: 'bad',
      debugMask: 99,
      welcomeShown: 'yes',
      customInstruments: [
        {name: 'Drop D', notes: [38, 45, 50, 55, 59, 64]},
        {name: 'Drop D', notes: [40, 45, 50, 55, 59, 64]},
        {name: '<name>', notes: [40, 45]},
        {name: 'Broken', notes: [40]},
        null,
      ],
      customTemperaments: [{name: 'Just', cents: [1, 2]}],
    });

    expect(settings.viewMode).toBe(4);
    expect(settings.sampleRate).toBe(44100);
    expect(settings.analysisRate).toBe(0);
    expect(settings.a4Reference).toBe(432.2);
    expect(settings.texTypeSpectrogram).toBe(5);
    expect(settings.noteNameStyle).toBe(0);
    expect(settings.inTuneThreshold).toBe(5);
    expect(settings.screenOrientation).toBe(0);
    expect(settings.usageMask).toBe(31);
    expect(settings.audioSetupVersion).toBe('Latest');
    expect(settings.audioAnalysisVersion).toBe('Latest');
    expect(settings.debugMask).toBe(7);
    expect(settings.welcomeShown).toBe(true);
    expect(settings.customInstruments).toHaveLength(1);
    expect(settings.customTemperaments[0].cents).toHaveLength(12);
  });

  test('handles custom-name prefixes and resolution fallbacks', () => {
    expect(isCustomName('!Drop D')).toBe(true);
    expect(displayDefinitionName('!Drop D')).toBe('Drop D');
    expect(customName('Drop D')).toBe('!Drop D');

    const custom = sanitizeSettings({
      instrumentName: '!Drop D',
      customInstruments: [{name: 'Drop D', notes: [38, 45, 50, 55, 59, 64]}],
    });
    expect(resolveInstrument(custom)).toMatchObject({
      name: 'Drop D',
      notes: [38, 45, 50, 55, 59, 64],
      custom: true,
    });

    const preset = resolveInstrument({
      ...DEFAULT_SETTINGS,
      instrumentName: PRESET_INSTRUMENTS[1].name,
    });
    expect(preset.name).toBe(PRESET_INSTRUMENTS[1].name);

    const fallback = resolveInstrument({...DEFAULT_SETTINGS, instrumentName: '!missing'});
    expect(fallback.name).toBe(PRESET_INSTRUMENTS[0].name);
  });

  test('resolves preset and custom temperaments', () => {
    const preset = resolveTemperament({
      ...DEFAULT_SETTINGS,
      temperamentName: PRESET_TEMPERAMENTS[1].name,
    });
    expect(preset.name).toBe(PRESET_TEMPERAMENTS[1].name);

    const custom = resolveTemperament(
      sanitizeSettings({
        temperamentName: '!My Temperament',
        customTemperaments: [{name: 'My Temperament', cents: Array(12).fill(3)}],
      }),
    );
    expect(custom).toMatchObject({name: 'My Temperament', custom: true});
    expect(custom.cents).toEqual(Array(12).fill(3));
  });

  test('validates names, duplicate handling, and placeholders', () => {
    expect(validateDefinitionName('', [])).toBe('Enter a name.');
    expect(validateDefinitionName('<name>', [])).toBe('Replace the <name> placeholder.');
    expect(validateDefinitionName('Drop D', ['Drop D'])).toContain('already exists');
    expect(validateDefinitionName('Drop D', ['Drop D'], 'Drop D')).toBeNull();
    expect(validateDefinitionName('Open G', ['Drop D'])).toBeNull();
  });

  test('overwrites by id or name and enforces the custom cap', () => {
    const list = [instrument('A'), instrument('B')];
    expect(replaceById(list, instrument('A', 'new-id'), 'A')).toEqual([
      instrument('A', 'new-id'),
      instrument('B'),
    ]);

    expect(replaceById(list, instrument('B', 'replacement'), 'A')).toEqual([
      instrument('B', 'replacement'),
    ]);

    expect(replaceById(list, instrument('C', 'new-id'), 'B')).toEqual([
      instrument('A'),
      instrument('C', 'new-id'),
    ]);

    const full = Array.from({length: maxCustomDefinitions()}, (_, index) =>
      instrument(`Name ${index.toString().padStart(3, '0')}`),
    );
    const next = replaceById(full, instrument('000 Newest'));
    expect(next).toHaveLength(maxCustomDefinitions());
    expect(next.some(item => item.name === '000 Newest')).toBe(true);
  });

  test('replaces temperament entries and preserves customs on reset', () => {
    const list = [temperament('A'), temperament('B')];
    expect(replaceTemperament(list, temperament('A', 'new-id'), 'A')).toEqual([
      temperament('A', 'new-id'),
      temperament('B'),
    ]);

    const custom = sanitizeSettings({
      customInstruments: [{name: 'Drop D', notes: [38, 45, 50, 55, 59, 64]}],
      customTemperaments: [{name: 'Just', cents: Array(12).fill(2)}],
      a4Reference: 432,
      viewMode: 3,
    });
    const reset = resetSettingsPreservingCustom(custom);
    expect(reset.a4Reference).toBe(DEFAULT_SETTINGS.a4Reference);
    expect(reset.viewMode).toBe(DEFAULT_SETTINGS.viewMode);
    expect(reset.customInstruments).toEqual(custom.customInstruments);
    expect(reset.customTemperaments).toEqual(custom.customTemperaments);
  });
});
