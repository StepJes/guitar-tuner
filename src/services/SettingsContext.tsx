import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {Settings} from '../types/settings';
import {loadSettings, saveSettings} from '../services/settingsStorage';
import {
  DEFAULT_SETTINGS,
  resetSettingsPreservingCustom,
  sanitizeSettings,
} from '../utils/validation';

interface SettingsContextValue {
  settings: Settings;
  loaded: boolean;
  revision: number;
  storageWarning: string | null;
  update: (patch: Partial<Settings>) => void;
  replace: (next: Settings) => void;
  reset: () => void;
  markWelcomeShown: () => void;
  clearStorageWarning: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({children}: {children: React.ReactNode}) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [revision, setRevision] = useState(0);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const settingsRef = useRef(settings);
  const loadedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  settingsRef.current = settings;

  useEffect(() => {
    let cancelled = false;
    loadSettings().then(result => {
      if (cancelled) {
        return;
      }
      setSettings(result.settings);
      settingsRef.current = result.settings;
      setStorageWarning(result.warning ?? null);
      loadedRef.current = true;
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loadedRef.current) {
      return;
    }
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    saveTimer.current = setTimeout(() => {
      saveSettings(settings).catch(error => {
        setStorageWarning(
          `Settings could not be saved: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      });
    }, 250);
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [settings]);

  const replace = useCallback((next: Settings) => {
    setSettings(sanitizeSettings(next));
    setRevision(value => value + 1);
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings(previous => sanitizeSettings({...previous, ...patch}));
    setRevision(value => value + 1);
  }, []);

  const reset = useCallback(() => {
    setSettings(previous => resetSettingsPreservingCustom(previous));
    setRevision(value => value + 1);
  }, []);

  const markWelcomeShown = useCallback(() => {
    setSettings(previous => (previous.welcomeShown ? previous : {...previous, welcomeShown: true}));
    setRevision(value => value + 1);
  }, []);

  const clearStorageWarning = useCallback(() => setStorageWarning(null), []);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      loaded,
      revision,
      storageWarning,
      update,
      replace,
      reset,
      markWelcomeShown,
      clearStorageWarning,
    }),
    [settings, loaded, revision, storageWarning, update, replace, reset, markWelcomeShown, clearStorageWarning],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used inside SettingsProvider');
  }
  return context;
}

export {SettingsContext};
