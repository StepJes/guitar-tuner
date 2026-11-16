import AsyncStorage from '@react-native-async-storage/async-storage';
import {DEFAULT_SETTINGS, sanitizeSettings} from '../utils/validation';
import {Settings} from '../types/settings';

const STORAGE_KEY = '@pitchlab/settings/v1';

export interface LoadResult {
  settings: Settings;
  warning?: string;
}

export async function loadSettings(): Promise<LoadResult> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {settings: {...DEFAULT_SETTINGS}};
    }
    const parsed = JSON.parse(raw) as unknown;
    const envelope =
      parsed && typeof parsed === 'object' && 'settings' in (parsed as Record<string, unknown>)
        ? (parsed as Record<string, unknown>).settings
        : parsed;
    return {
      settings: sanitizeSettings(envelope),
      warning: parsed && typeof parsed === 'object' && 'settings' in (parsed as Record<string, unknown>) ? undefined : undefined,
    };
  } catch (error) {
    return {
      settings: {...DEFAULT_SETTINGS},
      warning: `Saved settings could not be read. Defaults were restored. ${
        error instanceof Error ? error.message : ''
      }`.trim(),
    };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  const envelope = {schemaVersion: 1, settings};
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}

export async function clearSettings(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export {STORAGE_KEY};
