import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import {AudioError, AudioState, AudioStatus, TunerReading} from '../types/audio';
import {
  addReadingListener,
  addStatusListener,
  AudioConfig,
  isNativeAudioAvailable,
  NativeStatusPayload,
  startAudioEngine,
  stopAudioEngine,
} from '../native/PitchLabAudio';
import {useSettings} from '../services/SettingsContext';
import {resolveInstrument, resolveTemperament} from '../utils/validation';

export type PermissionState = 'unknown' | 'requesting' | 'granted' | 'denied' | 'blocked';

interface AudioEngineContextValue {
  status: AudioStatus;
  reading: TunerReading | null;
  error: AudioError | null;
  permission: PermissionState;
  sessionId: number;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  retry: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  refreshPermission: () => Promise<boolean>;
  clearError: () => void;
}

const AudioEngineContext = createContext<AudioEngineContextValue | null>(null);

const IDLE: AudioStatus = {state: 'idle'};

function normalizeError(error: unknown, sampleRate?: number): AudioError {
  const record = error as {code?: string; message?: string; recoverable?: boolean};
  return {
    code: record?.code || 'AUDIO_START_FAILED',
    message: record?.message || 'The microphone could not be started.',
    attemptedSampleRate: sampleRate,
    recoverable: record?.recoverable !== false,
  };
}

export function AudioEngineProvider({children}: {children: React.ReactNode}) {
  const {settings, loaded} = useSettings();
  const [status, setStatus] = useState<AudioStatus>(IDLE);
  const [reading, setReading] = useState<TunerReading | null>(null);
  const [error, setError] = useState<AudioError | null>(null);
  const [permission, setPermission] = useState<PermissionState>('unknown');
  const [sessionId, setSessionId] = useState(0);
  const sessionRef = useRef(0);
  const runningRef = useRef(false);
  const statusStateRef = useRef<AudioState>('idle');
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  statusStateRef.current = status.state;

  // Only DSP-relevant values should recreate AudioRecord. Changing the view,
  // usage bits, welcome flag or other presentation settings must not glitch the
  // microphone while the tuner is live.
  const dspKey = useMemo(() => {
    const instrument = resolveInstrument(settings);
    const temperament = resolveTemperament(settings);
    return JSON.stringify([
      settings.sampleRate,
      settings.analysisRate,
      settings.a4Reference,
      settings.audioSetupVersion,
      settings.audioAnalysisVersion,
      settings.debugMask & 1,
      instrument.notes,
      temperament.cents,
    ]);
  }, [settings]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      setPermission('blocked');
      return;
    }
    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)
      .then(granted => setPermission(granted ? 'granted' : 'unknown'))
      .catch(() => setPermission('unknown'));
  }, []);

  useEffect(() => {
    const removeReading = addReadingListener(next => {
      if (next?.sessionId && next.sessionId !== sessionRef.current) {
        return;
      }
      setReading(next);
    });
    const removeStatus = addStatusListener((next: NativeStatusPayload) => {
      if (next.sessionId && next.sessionId !== sessionRef.current) {
        return;
      }
      if (next.error) {
        const normalized = normalizeError(next.error, next.error.attemptedSampleRate);
        setError(normalized);
        runningRef.current = false;
      }
      setStatus({
        state: next.state as AudioState,
        sampleRate: next.sampleRate,
        analysisRate: next.analysisRate,
        message: next.message,
      });
      if (next.state === 'running') {
        runningRef.current = true;
        setError(null);
      }
      if (next.state === 'error' || next.state === 'stopped') {
        runningRef.current = false;
      }
    });
    return () => {
      removeReading();
      removeStatus();
    };
  }, []);

  const stop = useCallback(async () => {
    sessionRef.current += 1;
    runningRef.current = false;
    setReading(null);
    setStatus({state: 'stopped'});
    try {
      await stopAudioEngine();
    } catch {
      // The engine may already have been released after an error.
    }
  }, []);

  const start = useCallback(async () => {
    if (!loaded) {
      return;
    }
    if (!isNativeAudioAvailable()) {
      setError({
        code: 'NATIVE_MODULE_MISSING',
        message: 'The native audio module is missing. Reinstall a complete build of PitchLab.',
        recoverable: false,
      });
      setStatus({state: 'error'});
      return;
    }

    const current = settingsRef.current;
    if ((current.debugMask & 1) !== 0) {
      sessionRef.current += 1;
      runningRef.current = false;
      setReading(null);
      setError(null);
      setStatus({state: 'disabled', message: 'Audio input is disabled in Debugging options.'});
      await stopAudioEngine().catch(() => undefined);
      return;
    }

    const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO).catch(
      () => false,
    );
    if (!granted) {
      sessionRef.current += 1;
      runningRef.current = false;
      setReading(null);
      setStatus({state: 'no_permission'});
      setPermission(previous => (previous === 'granted' ? 'unknown' : previous));
      return;
    }

    setPermission('granted');
    sessionRef.current += 1;
    const nextSession = sessionRef.current;
    setSessionId(nextSession);
    setError(null);
    setReading(null);
    setStatus({state: 'starting', sampleRate: current.sampleRate, analysisRate: current.analysisRate});

    const instrument = resolveInstrument(current);
    const temperament = resolveTemperament(current);
    const config: AudioConfig = {
      sampleRate: current.sampleRate,
      analysisRate: current.analysisRate,
      a4Reference: current.a4Reference,
      temperamentCents: temperament.cents,
      instrumentNotes: instrument.notes,
      inTuneThreshold: current.inTuneThreshold,
      audioSetupVersion: current.audioSetupVersion,
      audioAnalysisVersion: current.audioAnalysisVersion,
      debugMask: current.debugMask,
      noteNameStyle: current.noteNameStyle,
      sessionId: nextSession,
    };

    try {
      await startAudioEngine(config);
      if (sessionRef.current === nextSession) {
        runningRef.current = true;
        setStatus({state: 'running', sampleRate: current.sampleRate, analysisRate: current.analysisRate});
      }
    } catch (caught) {
      if (sessionRef.current !== nextSession) {
        return;
      }
      runningRef.current = false;
      const normalized = normalizeError(caught, current.sampleRate);
      setError(normalized);
      setStatus({state: 'error', sampleRate: current.sampleRate, message: normalized.message});
    }
  }, [loaded]);

  const retry = useCallback(async () => {
    await stop();
    await start();
  }, [start, stop]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      setPermission('blocked');
      return false;
    }
    setPermission('requesting');
    setStatus({state: 'requesting'});
    try {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
        title: 'Microphone access',
        message:
          'PitchLab listens to your instrument to measure pitch. Audio is analysed on this device and is never recorded or uploaded.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      });
      if (result === PermissionsAndroid.RESULTS.GRANTED) {
        setPermission('granted');
        setStatus({state: 'idle'});
        return true;
      }
      setPermission(result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ? 'blocked' : 'denied');
      setStatus({state: 'no_permission'});
      return false;
    } catch {
      setPermission('denied');
      setStatus({state: 'no_permission'});
      return false;
    }
  }, []);

  const refreshPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return false;
    }
    const granted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ).catch(() => false);
    if (granted) {
      setPermission('granted');
      return true;
    }
    setPermission(previous => (previous === 'granted' ? 'unknown' : previous));
    return false;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    if (status.state === 'error') {
      setStatus({state: 'idle'});
    }
  }, [status.state]);

  // Restart only when the committed DSP configuration changes while the engine
  // is active.
  const lastDspKey = useRef(dspKey);
  useEffect(() => {
    if (lastDspKey.current === dspKey) {
      return;
    }
    lastDspKey.current = dspKey;
    if (runningRef.current || statusStateRef.current === 'starting') {
      stop().then(() => start());
    }
  }, [dspKey, start, stop]);

  const value = useMemo<AudioEngineContextValue>(
    () => ({
      status,
      reading,
      error,
      permission,
      sessionId,
      start,
      stop,
      retry,
      requestPermission,
      refreshPermission,
      clearError,
    }),
    [
      status,
      reading,
      error,
      permission,
      sessionId,
      start,
      stop,
      retry,
      requestPermission,
      refreshPermission,
      clearError,
    ],
  );

  return <AudioEngineContext.Provider value={value}>{children}</AudioEngineContext.Provider>;
}

export function useAudioEngine(): AudioEngineContextValue {
  const context = useContext(AudioEngineContext);
  if (!context) {
    throw new Error('useAudioEngine must be used inside AudioEngineProvider');
  }
  return context;
}

export {AudioEngineContext};
