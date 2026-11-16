import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  AppState,
  Linking,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Screen} from '../components/Screen';
import {AppHeader} from '../components/AppHeader';
import {StatusBanner} from '../components/StatusBanner';
import {PermissionGate} from '../components/PermissionGate';
import {ViewSelector} from '../components/ViewSelector';
import {EmptyState} from '../components/EmptyState';
import {DialogModal} from '../components/DialogModal';
import {AppButton} from '../components/AppButton';
import {Icon} from '../components/Icon';
import {colors, spacing, type} from '../constants/theme';
import {DEFAULT_TEMPERAMENT, VIEW_NAMES} from '../constants/presets';
import {useSettings} from '../services/SettingsContext';
import {useAudioEngine} from '../services/AudioEngineContext';
import {useReduceMotion} from '../hooks/useReduceMotion';
import {presentReading} from '../features/tuner/reading';
import {InstrumentView} from '../features/tuner/InstrumentView';
import {DialStrobeView} from '../features/tuner/DialStrobeView';
import {SpectrogramView} from '../features/tuner/SpectrogramView';
import {ChordsView} from '../features/tuner/ChordsView';
import {BigStrobeView} from '../features/tuner/BigStrobeView';
import {HelpDialog} from '../features/options/HelpDialog';
import {
  addMenuListener,
  setKeepScreenOn,
  setRequestedOrientation,
} from '../native/PitchLabAudio';
import {displayDefinitionName, resolveInstrument, resolveTemperament} from '../utils/validation';
import type {RootStackParamList} from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Tuner'>;

function countUsageBits(mask: number): number {
  let count = 0;
  for (let index = 0; index < 5; index += 1) {
    if ((mask & (1 << index)) !== 0) {
      count += 1;
    }
  }
  return count;
}

export function TunerScreen({navigation}: Props) {
  const {width, height} = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const {settings, loaded, update, storageWarning, clearStorageWarning, markWelcomeShown} =
    useSettings();
  const {
    status,
    reading,
    error,
    permission,
    start,
    stop,
    retry,
    requestPermission,
    refreshPermission,
    clearError,
  } = useAudioEngine();

  const [focused, setFocused] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [startupNoticeVisible, setStartupNoticeVisible] = useState(false);
  const [focusSerial, setFocusSerial] = useState(0);
  const view = Math.min(4, Math.max(0, settings.viewMode));
  const instrument = useMemo(() => resolveInstrument(settings), [settings]);
  const temperament = useMemo(() => resolveTemperament(settings), [settings]);
  const presentation = presentReading(reading, settings);
  const audioDebugOff = (settings.debugMask & 1) !== 0;
  const visualisationsOff = (settings.debugMask & 2) !== 0;
  const landscape = width > height;

  const startRef = useRef(start);
  const stopRef = useRef(stop);
  const refreshRef = useRef(refreshPermission);
  const settingsRef = useRef(settings);
  const focusedRef = useRef(false);
  startRef.current = start;
  stopRef.current = stop;
  refreshRef.current = refreshPermission;
  settingsRef.current = settings;

  const usageCount = countUsageBits(settings.usageMask);
  const remainingViews = Math.max(0, 5 - usageCount);
  const showHint = loaded && remainingViews > 0 && !hintDismissed;

  const startupNotice = useMemo(() => {
    const notices: string[] = [];
    if (Math.abs(settings.a4Reference - 440) > 0.0001) {
      notices.push(`A4 reference is ${settings.a4Reference.toFixed(1)} Hz`);
    }
    if (displayDefinitionName(settings.temperamentName) !== DEFAULT_TEMPERAMENT) {
      notices.push(`Temperament: ${displayDefinitionName(temperament.name)}`);
    }
    return notices.join(' · ');
  }, [settings.a4Reference, settings.temperamentName, temperament.name]);

  const swipeX = useRef(new Animated.Value(0)).current;
  const widthRef = useRef(width);
  const reduceRef = useRef(reduceMotion);
  widthRef.current = width;
  reduceRef.current = reduceMotion;

  useEffect(() => {
    if (!loaded) {
      return;
    }
    if (!settings.welcomeShown) {
      setHelpVisible(true);
    }
  }, [loaded, settings.welcomeShown]);

  useEffect(() => {
    if (!loaded) {
      return;
    }
    const bit = 1 << view;
    if ((settings.usageMask & bit) === 0) {
      update({usageMask: settings.usageMask | bit});
    }
  }, [loaded, settings.usageMask, update, view]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setFocusSerial(value => value + 1);
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (!loaded || !startupNotice) {
      setStartupNoticeVisible(false);
      return;
    }
    setStartupNoticeVisible(true);
    const timer = setTimeout(() => setStartupNoticeVisible(false), 7000);
    return () => clearTimeout(timer);
  }, [focusSerial, loaded, startupNotice]);

  useEffect(() => {
    if (error) {
      setErrorVisible(true);
    }
  }, [error]);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      setFocused(true);
      setKeepScreenOn(true);
      setRequestedOrientation(settingsRef.current.screenOrientation);
      startRef.current();

      const subscription = AppState.addEventListener('change', nextState => {
        if (!focusedRef.current) {
          return;
        }
        if (nextState === 'active') {
          setKeepScreenOn(true);
          refreshRef.current().then(() => startRef.current());
        } else if (nextState === 'background' || nextState === 'inactive') {
          stopRef.current();
        }
      });

      return () => {
        focusedRef.current = false;
        setFocused(false);
        subscription.remove();
        setKeepScreenOn(false);
        stopRef.current();
      };
    }, []),
  );

  const moveView = useCallback(
    (direction: 1 | -1) => {
      const next = (view + direction + 5) % 5;
      update({viewMode: next});
    },
    [update, view],
  );

  const completeSwipe = useCallback(
    (direction: 1 | -1) => {
      if (reduceRef.current) {
        moveView(direction);
        swipeX.setValue(0);
        return;
      }
      const exit = direction === 1 ? -widthRef.current : widthRef.current;
      Animated.timing(swipeX, {
        toValue: exit,
        duration: 170,
        useNativeDriver: true,
      }).start(() => {
        moveView(direction);
        swipeX.setValue(-exit);
        Animated.timing(swipeX, {
          toValue: 0,
          duration: 210,
          useNativeDriver: true,
        }).start();
      });
    },
    [moveView, swipeX],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.25,
        onPanResponderMove: (_, gesture) => {
          if (!reduceRef.current) {
            swipeX.setValue(gesture.dx * 0.55);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          const horizontal = Math.abs(gesture.dx) > 48 && Math.abs(gesture.dx) > Math.abs(gesture.dy);
          const fling = Math.abs(gesture.vx) > 0.45 && Math.abs(gesture.vx) > Math.abs(gesture.vy);
          if (horizontal || fling) {
            completeSwipe((gesture.dx < 0 || gesture.vx < 0) ? 1 : -1);
          } else {
            Animated.spring(swipeX, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 0,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(swipeX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        },
      }),
    [completeSwipe, swipeX],
  );

  const openOptions = useCallback(() => {
    setSelectorVisible(false);
    navigation.navigate('Options');
  }, [navigation]);

  useEffect(() => {
    if (!focused) {
      return;
    }
    return addMenuListener(openOptions);
  }, [focused, openOptions]);

  const closeHelp = useCallback(() => {
    setHelpVisible(false);
    if (!settings.welcomeShown) {
      markWelcomeShown();
    }
  }, [markWelcomeShown, settings.welcomeShown]);

  const handlePermission = useCallback(async () => {
    const granted = await requestPermission();
    if (granted) {
      await startRef.current();
    }
  }, [requestPermission]);

  const openSystemSettings = useCallback(() => {
    Linking.openSettings().catch(() => undefined);
  }, []);

  const renderVisualisation = () => {
    if (audioDebugOff) {
      return (
        <PermissionGate
          permission={permission}
          onRequest={handlePermission}
          onOpenSettings={openSystemSettings}
          audioDisabled
        />
      );
    }
    if (permission !== 'granted' && status.state !== 'error') {
      return (
        <PermissionGate
          permission={permission}
          onRequest={handlePermission}
          onOpenSettings={openSystemSettings}
        />
      );
    }
    if (visualisationsOff) {
      return (
        <EmptyState
          icon="grid"
          title="Visualizations are off"
          message="Debugging options have disabled the live display. Audio analysis may continue, but no readings are drawn."
          actionLabel="Open debugging"
          onAction={openOptions}
        />
      );
    }
    const active = focused && (status.state === 'running' || status.state === 'starting');
    switch (view) {
      case 1:
        return <DialStrobeView reading={reading} settings={settings} active={active} />;
      case 2:
        return <SpectrogramView reading={reading} settings={settings} active={active} />;
      case 3:
        return <ChordsView reading={reading} settings={settings} active={active} />;
      case 4:
        return <BigStrobeView reading={reading} settings={settings} active={active} />;
      default:
        return <InstrumentView reading={reading} settings={settings} active={active} />;
    }
  };

  const attemptedRate = error?.attemptedSampleRate ?? settings.sampleRate;

  return (
    <Screen>
      <View style={styles.root}>
        <AppHeader
          subtitle={`${VIEW_NAMES[view]} · ${landscape ? 'LANDSCAPE' : 'PORTRAIT'}`}
          onViews={() => setSelectorVisible(true)}
          onOptions={openOptions}
          compact={landscape}
        />

        <View style={styles.summaryBar}>
          <Text style={styles.summaryText} numberOfLines={1}>
            {displayDefinitionName(instrument.name)}
            <Text style={styles.summaryDim}>
              {'  ·  '}
              {displayDefinitionName(temperament.name)}
            </Text>
          </Text>
          <Text style={styles.summaryValue}>A4 {settings.a4Reference.toFixed(1)}</Text>
        </View>

        {storageWarning ? (
          <StatusBanner
            tone="warning"
            message={storageWarning}
            onDismiss={clearStorageWarning}
          />
        ) : null}
        {startupNoticeVisible && startupNotice ? (
          <StatusBanner tone="info" message={startupNotice} onDismiss={() => setStartupNoticeVisible(false)} />
        ) : null}
        {error && !errorVisible ? (
          <StatusBanner
            tone="danger"
            message="Audio setup failed. Open the diagnostic dialog or retry."
            actionLabel="Details"
            onAction={() => setErrorVisible(true)}
          />
        ) : null}

        <View style={styles.visualWrap} {...panResponder.panHandlers}>
          <Animated.View
            style={[
              styles.animatedView,
              reduceMotion
                ? undefined
                : {
                    transform: [{translateX: swipeX}],
                    opacity: swipeX.interpolate({
                      inputRange: [-width, 0, width],
                      outputRange: [0.45, 1, 0.45],
                      extrapolate: 'clamp',
                    }),
                  },
            ]}>
            <Pressable
              style={styles.pressSurface}
              onPress={() => {
                if (showHint) {
                  setHintDismissed(true);
                }
              }}
              onLongPress={() => {
                if (!reduceMotion) {
                  Animated.spring(swipeX, {toValue: 0, useNativeDriver: true, bounciness: 0}).start();
                }
                setSelectorVisible(true);
              }}
              delayLongPress={450}
              accessibilityLabel={`${VIEW_NAMES[view]} tuner display`}
              accessibilityHint="Swipe left or right to change view. Press and hold to open the view menu.">
              {renderVisualisation()}
            </Pressable>
          </Animated.View>
        </View>

        <View style={styles.statusBar}>
          <View style={styles.statusLeft}>
            <View
              style={[
                styles.statusDot,
                status.state === 'running' && styles.statusDotRunning,
                status.state === 'error' && styles.statusDotError,
              ]}
            />
            <Text style={styles.statusText} numberOfLines={1}>
              {audioDebugOff
                ? 'AUDIO DEBUG OFF'
                : status.state === 'running'
                  ? `${formatAnalysisRate(settings.analysisRate)} · ${settings.sampleRate / 1000} kHz`
                  : status.state === 'starting'
                    ? 'STARTING AUDIO'
                    : status.state === 'requesting'
                      ? 'REQUESTING MICROPHONE'
                      : status.state === 'no_permission'
                        ? 'MICROPHONE PERMISSION NEEDED'
                        : status.state === 'error'
                          ? 'AUDIO ERROR'
                          : 'AUDIO PAUSED'}
            </Text>
          </View>
          <Text style={styles.statusRight} numberOfLines={1}>
            {presentation.hasSignal
              ? `${presentation.centsText} · ${Math.round(presentation.confidence * 100)}%`
              : 'NO SIGNAL'}
          </Text>
        </View>

        {showHint ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Swipe left or right to change view. ${remainingViews} views remaining. Tap to dismiss.`}
            onPress={() => setHintDismissed(true)}
            style={({pressed}) => [styles.hint, pressed && styles.hintPressed]}>
            <Text style={styles.hintText}>SWIPE SCREEN LEFT/RIGHT</Text>
            <Text style={styles.hintRemaining}>({remainingViews} REMAINING)</Text>
          </Pressable>
        ) : null}
      </View>

      <ViewSelector
        visible={selectorVisible}
        currentView={view}
        onClose={() => setSelectorVisible(false)}
        onSelect={index => update({viewMode: index})}
        onOptions={openOptions}
      />

      <HelpDialog visible={helpVisible} onClose={closeHelp} firstRun={!settings.welcomeShown} />

      <DialogModal
        visible={errorVisible && Boolean(error)}
        title="Audio error!"
        onClose={() => setErrorVisible(false)}
        footer={
          <View style={styles.errorFooter}>
            <AppButton
              label="Retry"
              variant="primary"
              onPress={() => {
                setErrorVisible(false);
                clearError();
                retry();
              }}
              style={styles.errorButton}
              icon={<Icon name="retry" size={16} color="#03100C" />}
            />
            <AppButton
              label="Sample rate"
              onPress={() => {
                setErrorVisible(false);
                navigation.navigate('Options');
              }}
              style={styles.errorButton}
            />
            <AppButton
              label="Dismiss"
              onPress={() => setErrorVisible(false)}
              style={styles.errorButton}
            />
          </View>
        }>
        <View style={styles.errorBody}>
          <Icon name="warning" size={38} color={colors.danger} />
          <Text style={styles.errorLead}>
            Use Options to select a valid sample rate, or try rebooting your device (power down,
            then power back up normally).
          </Text>
          <View style={styles.errorDetails}>
            <Text style={styles.errorDetailLabel}>ATTEMPTED SAMPLE RATE</Text>
            <Text style={styles.errorDetailValue}>{attemptedRate} Hz ({attemptedRate / 1000} kHz)</Text>
            <Text style={styles.errorDetailLabel}>ERROR</Text>
            <Text style={styles.errorDetailValue}>{error?.message || 'The microphone could not start.'}</Text>
            {error?.code ? <Text style={styles.errorCode}>{error.code}</Text> : null}
          </View>
          <Text style={styles.errorNote}>
            No readings are displayed while the microphone engine is unavailable.
          </Text>
        </View>
      </DialogModal>
    </Screen>
  );
}

function formatAnalysisRate(rate: number) {
  return rate === 1 ? 'HIGH' : rate === -1 ? 'LOW' : 'MEDIUM';
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  summaryBar: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  summaryText: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: type.body,
    fontSize: 11,
  },
  summaryDim: {
    color: colors.textMuted,
  },
  summaryValue: {
    color: colors.accent,
    fontFamily: type.mono,
    fontSize: 10,
  },
  visualWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  animatedView: {
    flex: 1,
  },
  pressSurface: {
    flex: 1,
  },
  statusBar: {
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  statusDotRunning: {
    backgroundColor: colors.accent,
  },
  statusDotError: {
    backgroundColor: colors.danger,
  },
  statusText: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 8,
    letterSpacing: 0.5,
  },
  statusRight: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 8,
  },
  hint: {
    position: 'absolute',
    bottom: 34,
    alignSelf: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,200,87,0.55)',
    backgroundColor: 'rgba(5,9,11,0.88)',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    gap: 1,
    zIndex: 4,
  },
  hintPressed: {
    opacity: 0.7,
  },
  hintText: {
    color: colors.warning,
    fontFamily: type.condensed,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  hintRemaining: {
    color: colors.textSecondary,
    fontFamily: type.mono,
    fontSize: 9,
  },
  errorFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    flex: 1,
  },
  errorButton: {
    flex: 1,
    minWidth: 112,
  },
  errorBody: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorLead: {
    color: colors.text,
    fontFamily: type.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  errorDetails: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.bg,
    padding: spacing.sm,
    gap: 3,
  },
  errorDetailLabel: {
    color: colors.textMuted,
    fontFamily: type.mono,
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 3,
  },
  errorDetailValue: {
    color: colors.textSecondary,
    fontFamily: type.mono,
    fontSize: 12,
  },
  errorCode: {
    color: colors.danger,
    fontFamily: type.mono,
    fontSize: 10,
    marginTop: 4,
  },
  errorNote: {
    color: colors.textMuted,
    fontFamily: type.body,
    fontSize: 11,
    textAlign: 'center',
  },
});
