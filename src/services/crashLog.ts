import AsyncStorage from '@react-native-async-storage/async-storage';

const CRASH_KEY = '@pitchlab/crashlog/v1';
const MAX_ENTRIES = 20;

export interface CrashEntry {
  timestamp: number;
  kind: 'render' | 'global' | 'promise';
  message: string;
  stack?: string;
  componentStack?: string;
  appVersion: string;
}

function serializeError(error: unknown): {message: string; stack?: string} {
  if (error instanceof Error) {
    return {message: error.message, stack: error.stack};
  }
  if (typeof error === 'string') {
    return {message: error};
  }
  try {
    return {message: JSON.stringify(error)};
  } catch {
    return {message: String(error)};
  }
}

export async function logCrash(
  kind: CrashEntry['kind'],
  error: unknown,
  componentStack?: string,
): Promise<void> {
  const details = serializeError(error);
  const entry: CrashEntry = {
    timestamp: Date.now(),
    kind,
    message: details.message.slice(0, 2000),
    stack: details.stack?.slice(0, 8000),
    componentStack: componentStack?.slice(0, 8000),
    appVersion: '1.0.22',
  };
  try {
    const raw = await AsyncStorage.getItem(CRASH_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    const entries = Array.isArray(parsed) ? parsed.filter(isCrashEntry) : [];
    entries.unshift(entry);
    await AsyncStorage.setItem(CRASH_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // Crash logging must never trigger another crash.
  }
}

function isCrashEntry(value: unknown): value is CrashEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.timestamp === 'number' && typeof record.message === 'string';
}

export async function loadCrashes(): Promise<CrashEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(CRASH_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter(isCrashEntry) : [];
  } catch {
    return [];
  }
}

export async function clearCrashes(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CRASH_KEY);
  } catch {
    // Ignore cleanup failure.
  }
}

export {CRASH_KEY};
