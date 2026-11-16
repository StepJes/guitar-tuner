export const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export const NOTE_NAMES = [SHARP_NAMES, FLAT_NAMES];

export const MIDI_MIN = 12;
export const MIDI_MAX = 120;

export function pitchClass(midi: number): number {
  return ((Math.round(midi) % 12) + 12) % 12;
}

export function noteName(midi: number, style = 0): string {
  const pc = pitchClass(midi);
  return (style === 1 ? FLAT_NAMES : SHARP_NAMES)[pc];
}

export function noteNameWithOctave(midi: number, style = 0): string {
  const rounded = Math.round(midi);
  return `${noteName(rounded, style)}${Math.floor(rounded / 12) - 1}`;
}

/** Spoken form for accessibility, e.g. "E flat 3". */
export function spokenNoteName(midi: number, style = 0): string {
  const name = noteName(midi, style);
  const spelled = name.replace('b', ' flat').replace('#', ' sharp');
  return `${spelled} ${Math.floor(Math.round(midi) / 12) - 1}`;
}

export function midiToFrequency(midi: number, a4 = 440): number {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

export function frequencyToMidiFloat(frequency: number, a4 = 440): number {
  if (!Number.isFinite(frequency) || frequency <= 0) {
    return 0;
  }
  return 69 + 12 * Math.log2(frequency / a4);
}

export function centsBetween(frequency: number, targetFrequency: number): number {
  if (!Number.isFinite(frequency) || !Number.isFinite(targetFrequency) || frequency <= 0 || targetFrequency <= 0) {
    return 0;
  }
  return 1200 * Math.log2(frequency / targetFrequency);
}

/**
 * Target frequency for a MIDI note under a twelve-note temperament.
 * The temperament array is indexed by pitch class (C..B).
 */
export function targetFrequency(
  midi: number,
  a4: number,
  temperamentCents: readonly number[] = [],
): number {
  const offset = temperamentCents.length === 12 ? temperamentCents[pitchClass(midi)] || 0 : 0;
  return midiToFrequency(midi, a4) * Math.pow(2, offset / 1200);
}

export interface TunedNote {
  midi: number;
  noteName: string;
  octave: number;
  targetFrequency: number;
  cents: number;
}

/**
 * Find the note (and temperament-adjusted target) closest in cents to the
 * measured frequency. Checks the chromatic neighbours because a temperament
 * offset can occasionally make a neighbour the closest target.
 */
export function nearestTunedNote(
  frequency: number,
  a4: number,
  temperamentCents: readonly number[],
  style = 0,
): TunedNote {
  const approximate = frequencyToMidiFloat(frequency, a4);
  const base = Math.round(approximate);
  let best: TunedNote | null = null;

  for (let midi = base - 1; midi <= base + 1; midi += 1) {
    if (midi < MIDI_MIN || midi > MIDI_MAX) {
      continue;
    }
    const target = targetFrequency(midi, a4, temperamentCents);
    const cents = centsBetween(frequency, target);
    const candidate: TunedNote = {
      midi,
      noteName: noteName(midi, style),
      octave: Math.floor(midi / 12) - 1,
      targetFrequency: target,
      cents,
    };
    if (!best || Math.abs(candidate.cents) < Math.abs(best.cents)) {
      best = candidate;
    }
  }

  if (!best) {
    const midi = Math.max(MIDI_MIN, Math.min(MIDI_MAX, base || 69));
    return {
      midi,
      noteName: noteName(midi, style),
      octave: Math.floor(midi / 12) - 1,
      targetFrequency: targetFrequency(midi, a4, temperamentCents),
      cents: centsBetween(frequency, targetFrequency(midi, a4, temperamentCents)),
    };
  }
  return best;
}

/** Parse strings such as "E2 A2 D3 G3 B3 E4" into ascending MIDI notes. */
export function parseNoteList(value: string): number[] {
  const tokens = value.trim().split(/\s+/).filter(Boolean);
  const notes: number[] = [];
  for (const token of tokens) {
    const match = /^([A-G])([#b]?)(-?\d+)$/.exec(token);
    if (!match) {
      continue;
    }
    const natural = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11}[match[1] as 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'];
    const accidental = match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0;
    const octave = Number(match[3]);
    const midi = (octave + 1) * 12 + natural + accidental;
    if (midi >= MIDI_MIN && midi <= MIDI_MAX) {
      notes.push(midi);
    }
  }
  return notes;
}

export function formattedNoteList(midiList: readonly number[], style = 0): string {
  return midiList.map(midi => noteNameWithOctave(midi, style)).join(' ');
}

export function formatHz(frequency: number, decimals = 1): string {
  if (!Number.isFinite(frequency) || frequency <= 0) {
    return '— Hz';
  }
  return `${frequency.toFixed(decimals)} Hz`;
}

export function formatCents(cents: number): string {
  if (!Number.isFinite(cents)) {
    return '—';
  }
  const rounded = Math.round(cents * 10) / 10;
  return `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}¢`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function qualityName(quality: string): string {
  switch (quality) {
    case 'maj':
      return 'maj';
    case 'min':
      return 'min';
    case 'maj7':
      return 'maj7';
    case 'min7':
      return 'min7';
    case 'dom7':
      return 'dom7';
    case 'dim7':
      return 'dim7';
    default:
      return quality;
  }
}
