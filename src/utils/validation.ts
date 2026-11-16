import {
  DEFAULT_INSTRUMENT,
  DEFAULT_TEMPERAMENT,
  PRESET_INSTRUMENTS,
  PRESET_TEMPERAMENTS,
  maxCustomDefinitions,
} from '../constants/presets';
import {InstrumentDefinition, Settings, TemperamentDefinition} from '../types/settings';
import {clamp, MIDI_MAX, MIDI_MIN, roundTo} from './notes';

export const DEFAULT_A4 = 440;
export const MIN_A4 = 220;
export const MAX_A4 = 880;
export const MIN_TEMPERAMENT_CENTS = -35;
export const MAX_TEMPERAMENT_CENTS = 35;
export const MAX_NAME_LENGTH = 100;

export const DEFAULT_SETTINGS: Settings = {
  viewMode: 0,
  sampleRate: 44100,
  analysisRate: 0,
  a4Reference: DEFAULT_A4,
  instrumentName: DEFAULT_INSTRUMENT,
  temperamentName: DEFAULT_TEMPERAMENT,
  texTypeSpectrogram: 5,
  noteNameStyle: 0,
  inTuneThreshold: 5,
  screenOrientation: 0,
  usageMask: 0,
  audioSetupVersion: 'Latest',
  audioAnalysisVersion: 'Latest',
  debugMask: 0,
  welcomeShown: false,
  customInstruments: [],
  customTemperaments: [],
};

export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function sanitizeName(raw: unknown): string {
  if (typeof raw !== 'string') {
    return '';
  }
  return raw
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME_LENGTH);
}

export function sanitizeInstrumentNotes(raw: unknown): number[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const notes = raw
    .map(value => (typeof value === 'number' ? Math.round(value) : Number.NaN))
    .filter(value => Number.isFinite(value))
    .map(value => clamp(value, MIDI_MIN, MIDI_MAX))
    .slice(0, 12);
  return notes.length >= 2 ? notes : [];
}

export function sanitizeTemperamentCents(raw: unknown): number[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const cents = raw.slice(0, 12).map(value => {
    const number = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(number)
      ? roundTo(clamp(number, MIN_TEMPERAMENT_CENTS, MAX_TEMPERAMENT_CENTS), 1)
      : 0;
  });
  while (cents.length < 12) {
    cents.push(0);
  }
  return cents;
}

function sanitizeCustomInstruments(raw: unknown): Settings['customInstruments'] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const seen = new Set<string>();
  const result: Settings['customInstruments'] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const record = item as Record<string, unknown>;
    const name = sanitizeName(record.name);
    const notes = sanitizeInstrumentNotes(record.notes);
    if (!name || name === '<name>' || notes.length < 2 || seen.has(name)) {
      continue;
    }
    seen.add(name);
    result.push({
      id: typeof record.id === 'string' && record.id ? record.id : makeId(),
      name,
      notes,
    });
    if (result.length >= maxCustomDefinitions()) {
      break;
    }
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

function sanitizeCustomTemperaments(raw: unknown): Settings['customTemperaments'] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const seen = new Set<string>();
  const result: Settings['customTemperaments'] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const record = item as Record<string, unknown>;
    const name = sanitizeName(record.name);
    const cents = sanitizeTemperamentCents(record.cents);
    if (!name || name === '<name>' || seen.has(name)) {
      continue;
    }
    seen.add(name);
    result.push({
      id: typeof record.id === 'string' && record.id ? record.id : makeId(),
      name,
      cents,
    });
    if (result.length >= maxCustomDefinitions()) {
      break;
    }
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

function pickEnum<T extends string | number>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function sanitizeA4(value: unknown): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) {
    return DEFAULT_A4;
  }
  return roundTo(clamp(number, MIN_A4, MAX_A4), 1);
}

export function sanitizeSettings(raw: unknown): Settings {
  const input = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    viewMode: clamp(Number.isFinite(Number(input.viewMode)) ? Math.round(Number(input.viewMode)) : 0, 0, 4),
    sampleRate: pickEnum(input.sampleRate, [44100, 22050, 11025, 8000] as const, 44100),
    analysisRate: pickEnum(input.analysisRate, [-1, 0, 1] as const, 0),
    a4Reference: sanitizeA4(input.a4Reference),
    instrumentName:
      typeof input.instrumentName === 'string' && input.instrumentName.trim()
        ? input.instrumentName.trim().slice(0, MAX_NAME_LENGTH + 1)
        : DEFAULT_INSTRUMENT,
    temperamentName:
      typeof input.temperamentName === 'string' && input.temperamentName.trim()
        ? input.temperamentName.trim().slice(0, MAX_NAME_LENGTH + 1)
        : DEFAULT_TEMPERAMENT,
    texTypeSpectrogram: pickEnum(input.texTypeSpectrogram, [4, 5] as const, 5),
    noteNameStyle: pickEnum(input.noteNameStyle, [0, 1] as const, 0),
    inTuneThreshold: pickEnum(input.inTuneThreshold, [5, 10, 15] as const, 5),
    screenOrientation: pickEnum(input.screenOrientation, [0, 1, 2] as const, 0),
    usageMask: clamp(
      Number.isFinite(Number(input.usageMask)) ? Math.round(Number(input.usageMask)) : 0,
      0,
      0b11111,
    ),
    audioSetupVersion: pickEnum(input.audioSetupVersion, ['1.0.0', '1.0.7', 'Latest'] as const, 'Latest'),
    audioAnalysisVersion: pickEnum(input.audioAnalysisVersion, ['1.0.15', 'Latest'] as const, 'Latest'),
    debugMask: clamp(
      Number.isFinite(Number(input.debugMask)) ? Math.round(Number(input.debugMask)) : 0,
      0,
      0b111,
    ),
    welcomeShown: Boolean(input.welcomeShown),
    customInstruments: sanitizeCustomInstruments(input.customInstruments),
    customTemperaments: sanitizeCustomTemperaments(input.customTemperaments),
  };
}

export function isCustomName(name: string): boolean {
  return name.startsWith('!');
}

export function displayDefinitionName(name: string): string {
  return isCustomName(name) ? name.slice(1) : name;
}

export function customName(name: string): string {
  return `!${name}`;
}

export function resolveInstrument(settings: Settings): InstrumentDefinition {
  const active = settings.instrumentName;
  if (isCustomName(active)) {
    const name = active.slice(1);
    const custom = settings.customInstruments.find(item => item.name === name);
    if (custom) {
      return {name: custom.name, notes: custom.notes, custom: true};
    }
  } else {
    const preset = PRESET_INSTRUMENTS.find(item => item.name === active);
    if (preset) {
      return {name: preset.name, notes: preset.notes, custom: false};
    }
  }
  const fallback = PRESET_INSTRUMENTS[0];
  return {name: fallback.name, notes: fallback.notes, custom: false};
}

export function resolveTemperament(settings: Settings): TemperamentDefinition {
  const active = settings.temperamentName;
  if (isCustomName(active)) {
    const name = active.slice(1);
    const custom = settings.customTemperaments.find(item => item.name === name);
    if (custom) {
      return {name: custom.name, cents: custom.cents, custom: true};
    }
  } else {
    const preset = PRESET_TEMPERAMENTS.find(item => item.name === active);
    if (preset) {
      return {name: preset.name, cents: preset.cents, custom: false};
    }
  }
  const fallback = PRESET_TEMPERAMENTS[0];
  return {name: fallback.name, cents: fallback.cents, custom: false};
}

export function validateDefinitionName(raw: string, existingNames: string[], editingName?: string): string | null {
  const name = sanitizeName(raw);
  if (!name) {
    return 'Enter a name.';
  }
  if (name === '<name>') {
    return 'Replace the <name> placeholder.';
  }
  if (name.length > MAX_NAME_LENGTH) {
    return `Use ${MAX_NAME_LENGTH} characters or fewer.`;
  }
  if (name !== editingName && existingNames.includes(name)) {
    return `A definition named “${name}” already exists.`;
  }
  return null;
}

export function replaceById(
  list: Settings['customInstruments'],
  item: Settings['customInstruments'][number],
  editingId?: string,
): Settings['customInstruments'] {
  const next = list.filter(entry => entry.id !== editingId && entry.name !== item.name);
  next.push(item);
  return next.sort((a, b) => a.name.localeCompare(b.name)).slice(0, maxCustomDefinitions());
}

export function replaceTemperament(
  list: Settings['customTemperaments'],
  item: Settings['customTemperaments'][number],
  editingId?: string,
): Settings['customTemperaments'] {
  const next = list.filter(entry => entry.id !== editingId && entry.name !== item.name);
  next.push(item);
  return next.sort((a, b) => a.name.localeCompare(b.name)).slice(0, maxCustomDefinitions());
}

export function resetSettingsPreservingCustom(settings: Settings): Settings {
  return {
    ...DEFAULT_SETTINGS,
    customInstruments: settings.customInstruments,
    customTemperaments: settings.customTemperaments,
  };
}
