export type ChordQuality = 'maj' | 'min' | 'maj7' | 'min7' | 'dom7' | 'dim7';

export interface ChordEstimate {
  root: number;
  quality: ChordQuality;
  name: string;
  confidence: number;
  scores: number[];
}

export interface TunerReading {
  frequency: number;
  midi: number;
  cents: number;
  confidence: number;
  rms: number;
  noteName: string;
  stringIndex: number;
  spectrum: number[];
  chroma: number[];
  waveform: number[];
  chordRoot: number;
  chordQuality: ChordQuality | '';
  chordName: string;
  chordConfidence: number;
  chordScores: number[];
  timestamp: number;
  sampleRate: number;
  sessionId: number;
}

export type AudioState =
  | 'idle'
  | 'requesting'
  | 'starting'
  | 'running'
  | 'disabled'
  | 'no_permission'
  | 'error'
  | 'stopped';

export interface AudioError {
  code: string;
  message: string;
  attemptedSampleRate?: number;
  recoverable?: boolean;
}

export interface AudioStatus {
  state: AudioState;
  sampleRate?: number;
  analysisRate?: number;
  message?: string;
}
