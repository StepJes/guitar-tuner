import {DeviceEventEmitter, NativeModules, Platform} from 'react-native';
import {AudioError, AudioStatus, TunerReading} from '../types/audio';
import {AudioAnalysisVersion, AudioSetupVersion, SampleRate} from '../types/settings';

const MODULE_NAME = 'PitchLabAudio';
const READING_EVENT = 'PitchLabAudio.reading';
const STATUS_EVENT = 'PitchLabAudio.status';
const MENU_EVENT = 'PitchLabAudio.menu';

interface NativePitchLabAudio {
  start(config: Record<string, unknown>): Promise<{started: boolean; sampleRate?: number}>;
  stop(): Promise<void>;
  setOrientation(mode: number): void;
  setKeepScreenOn(enabled: boolean): void;
  isMicrophoneAvailable(): Promise<boolean>;
  getCapabilities?(): Promise<{maxSampleRate: number; minSampleRate: number; nativeVersion: string}>;
}

const nativeModule = NativeModules[MODULE_NAME] as NativePitchLabAudio | undefined;

export interface AudioConfig {
  sampleRate: SampleRate;
  analysisRate: number;
  a4Reference: number;
  temperamentCents: number[];
  instrumentNotes: number[];
  inTuneThreshold: number;
  audioSetupVersion: AudioSetupVersion;
  audioAnalysisVersion: AudioAnalysisVersion;
  debugMask: number;
  noteNameStyle: number;
  sessionId: number;
}

export interface NativeStatusPayload extends AudioStatus {
  error?: AudioError;
  sessionId?: number;
}

export function isNativeAudioAvailable(): boolean {
  return Platform.OS === 'android' && Boolean(nativeModule);
}

export async function startAudioEngine(config: AudioConfig): Promise<void> {
  if (!nativeModule) {
    throw Object.assign(new Error('The PitchLabAudio native module is not available in this build.'), {
      code: 'NATIVE_MODULE_MISSING',
      recoverable: false,
    });
  }
  await nativeModule.start({
    ...config,
    instrumentNotes: config.instrumentNotes,
    temperamentCents: config.temperamentCents,
  });
}

export async function stopAudioEngine(): Promise<void> {
  if (!nativeModule) {
    return;
  }
  await nativeModule.stop();
}

export async function isMicrophoneAvailable(): Promise<boolean> {
  if (!nativeModule) {
    return false;
  }
  try {
    return await nativeModule.isMicrophoneAvailable();
  } catch {
    return false;
  }
}

export function setRequestedOrientation(mode: number): void {
  nativeModule?.setOrientation(mode);
}

export function setKeepScreenOn(enabled: boolean): void {
  nativeModule?.setKeepScreenOn(enabled);
}

export function addReadingListener(listener: (reading: TunerReading) => void): () => void {
  const subscription = DeviceEventEmitter.addListener(READING_EVENT, listener);
  return () => subscription.remove();
}

export function addStatusListener(listener: (status: NativeStatusPayload) => void): () => void {
  const subscription = DeviceEventEmitter.addListener(STATUS_EVENT, listener);
  return () => subscription.remove();
}

/** Hardware Menu key, forwarded by MainActivity. */
export function addMenuListener(listener: () => void): () => void {
  const subscription = DeviceEventEmitter.addListener(MENU_EVENT, listener);
  return () => subscription.remove();
}

export const nativeAudioEvents = {READING_EVENT, STATUS_EVENT, MENU_EVENT};
