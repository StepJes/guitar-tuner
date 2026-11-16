import {TunerReading} from '../../types/audio';
import {Settings} from '../../types/settings';
import {colors} from '../../constants/theme';
import {formatCents, formatHz, noteName, targetFrequency} from '../../utils/notes';
import {resolveTemperament} from '../../utils/validation';

export interface ReadingPresentation {
  hasSignal: boolean;
  midi: number;
  note: string;
  octave: number;
  cents: number;
  frequency: number;
  targetHz: number;
  inTune: boolean;
  statusText: string;
  statusColor: string;
  direction: 'flat' | 'sharp' | 'tuned' | 'none';
  centsText: string;
  hzText: string;
  noteText: string;
  confidence: number;
  rms: number;
}

export function presentReading(reading: TunerReading | null, settings: Settings): ReadingPresentation {
  const hasSignal = Boolean(reading && reading.midi >= 0 && reading.frequency > 0);
  const midi = reading?.midi ?? -1;
  const style = settings.noteNameStyle;
  const note = hasSignal ? noteName(midi, style) : '—';
  const octave = hasSignal ? Math.floor(midi / 12) - 1 : 0;
  const cents = hasSignal ? reading?.cents ?? 0 : 0;
  const inTune = hasSignal && Math.abs(cents) <= settings.inTuneThreshold;
  const direction = !hasSignal ? 'none' : inTune ? 'tuned' : cents < 0 ? 'flat' : 'sharp';
  const statusColor =
    direction === 'tuned'
      ? colors.accent
      : direction === 'flat'
        ? colors.flat
        : direction === 'sharp'
          ? colors.sharp
          : colors.textMuted;
  const statusText = !hasSignal
    ? 'LISTENING'
    : inTune
      ? 'IN TUNE!'
      : cents < 0
        ? 'TUNE UP'
        : 'TUNE DOWN';
  const temperament = resolveTemperament(settings);
  const targetHz = hasSignal
    ? targetFrequency(midi, settings.a4Reference, temperament.cents)
    : 0;

  return {
    hasSignal,
    midi,
    note,
    octave,
    cents,
    frequency: hasSignal ? reading?.frequency ?? 0 : 0,
    targetHz,
    inTune,
    statusText,
    statusColor,
    direction,
    centsText: hasSignal ? formatCents(cents) : '—',
    hzText: formatHz(hasSignal ? reading?.frequency ?? 0 : 0),
    noteText: hasSignal ? `${note}${octave}` : '—',
    confidence: reading?.confidence ?? 0,
    rms: reading?.rms ?? 0,
  };
}

export function chordDisplayName(root: number, quality: string, style: number): string {
  if (root < 0 || !quality) {
    return '—';
  }
  return `${noteName(root, style)}${quality}`;
}
