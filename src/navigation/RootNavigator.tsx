import React from 'react';
import {
  DarkTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {colors} from '../constants/theme';
import {TunerScreen} from '../screens/TunerScreen';
import {OptionsScreen} from '../screens/OptionsScreen';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Tuner"
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: colors.bg},
          animation: 'fade',
          animationDuration: 180,
        }}>
        <Stack.Screen name="Tuner" component={TunerScreen} />
        <Stack.Screen
          name="Options"
          component={OptionsScreen}
          options={{animation: 'slide_from_right', animationDuration: 220}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
