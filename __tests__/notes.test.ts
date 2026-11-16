import {
  clamp,
  centsBetween,
  formatCents,
  formatHz,
  formattedNoteList,
  frequencyToMidiFloat,
  midiToFrequency,
  nearestTunedNote,
  noteName,
  noteNameWithOctave,
  parseNoteList,
  pitchClass,
  qualityName,
  roundTo,
  spokenNoteName,
  targetFrequency,
} from '../src/utils/notes';

describe('note conversion utilities', () => {
  test('maps pitch classes for positive and negative MIDI values', () => {
    expect(pitchClass(60)).toBe(0);
    expect(pitchClass(69)).toBe(9);
    expect(pitchClass(-1)).toBe(11);
  });

  test('formats sharp and flat note names with octaves', () => {
    expect(noteName(61)).toBe('C#');
    expect(noteName(61, 1)).toBe('Db');
    expect(noteNameWithOctave(64)).toBe('E4');
    expect(spokenNoteName(63, 1)).toBe('E flat 4');
  });

  test('converts between MIDI and frequency around A4', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 8);
    expect(frequencyToMidiFloat(440)).toBeCloseTo(69, 8);
    expect(centsBetween(466.1637615, 440)).toBeCloseTo(100, 4);
  });

  test('rejects invalid frequencies without producing fake readings', () => {
    expect(frequencyToMidiFloat(0)).toBe(0);
    expect(frequencyToMidiFloat(Number.NaN)).toBe(0);
    expect(centsBetween(0, 440)).toBe(0);
  });

  test('applies temperament offsets by pitch class', () => {
    const temperament = [10, 0, 0, 0, 0, 0, 0, 0, 0, -10, 0, 0];
    expect(targetFrequency(60, 440, temperament)).toBeCloseTo(
      midiToFrequency(60) * Math.pow(2, 10 / 1200),
      6,
    );
    expect(targetFrequency(69, 440, temperament)).toBeCloseTo(
      midiToFrequency(69) * Math.pow(2, -10 / 1200),
      6,
    );
    expect(targetFrequency(69, 440, [])).toBeCloseTo(440, 8);
  });

  test('finds the nearest tempered note and reports cents', () => {
    const a4 = nearestTunedNote(440, 440, []);
    expect(a4.midi).toBe(69);
    expect(a4.noteName).toBe('A');
    expect(a4.octave).toBe(4);
    expect(a4.cents).toBeCloseTo(0, 8);

    const sharp = nearestTunedNote(445, 440, []);
    expect(sharp.midi).toBe(69);
    expect(sharp.cents).toBeGreaterThan(0);
  });

  test('parses and formats note lists', () => {
    expect(parseNoteList('E2 A2 D3 G3 B3 E4')).toEqual([40, 45, 50, 55, 59, 64]);
    expect(parseNoteList('E2 nope Z9 A2')).toEqual([40, 45]);
    expect(formattedNoteList([40, 45, 50, 55, 59, 64])).toBe('E2 A2 D3 G3 B3 E4');
  });

  test('formats values for display', () => {
    expect(formatHz(440)).toBe('440.0 Hz');
    expect(formatHz(0)).toBe('— Hz');
    expect(formatCents(5.46)).toBe('+5.5¢');
    expect(formatCents(-5.44)).toBe('-5.4¢');
    expect(formatCents(Number.NaN)).toBe('—');
  });

  test('clamps, rounds, and names chord qualities', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(roundTo(1.2345, 2)).toBe(1.23);
    expect(qualityName('maj7')).toBe('maj7');
    expect(qualityName('other')).toBe('other');
  });
});
