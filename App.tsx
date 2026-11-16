import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {BootScreen} from './src/components/BootScreen';
import {ErrorBoundary} from './src/components/ErrorBoundary';
import {RootNavigator} from './src/navigation/RootNavigator';
import {AudioEngineProvider} from './src/services/AudioEngineContext';
import {SettingsProvider, useSettings} from './src/services/SettingsContext';
import {logCrash} from './src/services/crashLog';
import {colors} from './src/constants/theme';

interface GlobalErrorUtils {
  setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
  getGlobalHandler?: () => ((error: Error, isFatal?: boolean) => void) | undefined;
}

function installGlobalErrorLogging() {
  const errorUtils = (globalThis as unknown as {ErrorUtils?: GlobalErrorUtils}).ErrorUtils;
  if (!errorUtils?.setGlobalHandler || !errorUtils.getGlobalHandler) {
    return;
  }
  const previous = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    logCrash('global', error);
    if (previous) {
      previous(error, isFatal);
    }
  });
}

function AppGate() {
  const {loaded} = useSettings();
  if (!loaded) {
    return <BootScreen />;
  }
  return (
    <AudioEngineProvider>
      <RootNavigator />
    </AudioEngineProvider>
  );
}

function App() {
  useEffect(() => {
    installGlobalErrorLogging();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.bg}
        translucent={false}
      />
      <ErrorBoundary>
        <SettingsProvider>
          <AppGate />
        </SettingsProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default App;
