import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, spacing, type} from '../constants/theme';
import {AppButton} from './AppButton';
import {Icon} from './Icon';
import {PermissionState} from '../services/AudioEngineContext';

interface PermissionGateProps {
  permission: PermissionState;
  onRequest: () => void;
  onOpenSettings: () => void;
  audioDisabled?: boolean;
}

export function PermissionGate({
  permission,
  onRequest,
  onOpenSettings,
  audioDisabled,
}: PermissionGateProps) {
  if (audioDisabled) {
    return (
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Icon name="mic" size={30} color={colors.warning} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          Audio input is off
        </Text>
        <Text style={styles.message}>
          Debugging options have disabled microphone input. Turn Audio Input back on in Options →
          Debugging to start tuning.
        </Text>
      </View>
    );
  }

  const blocked = permission === 'blocked';
  const denied = permission === 'denied';
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon name="mic" size={30} color={colors.accent} />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {blocked ? 'Microphone access is blocked' : 'PitchLab needs the microphone'}
      </Text>
      <Text style={styles.message}>
        {blocked
          ? 'Android has blocked microphone permission for this app. Open system settings and allow Microphone, then return here.'
          : denied
            ? 'Microphone access was declined. PitchLab cannot measure pitch without it. You can try again whenever you are ready.'
            : 'Allow microphone access to measure your instrument. Audio is analysed live on this device and is never recorded or uploaded.'}
      </Text>
      <View style={styles.actions}>
        {!blocked ? (
          <AppButton
            label={denied ? 'Try permission again' : 'Allow microphone'}
            variant="primary"
            onPress={onRequest}
            icon={<Icon name="mic" size={17} color="#03100C" />}
          />
        ) : null}
        <AppButton
          label={blocked ? 'Open app settings' : 'Open settings'}
          onPress={onOpenSettings}
        />
      </View>
      <Text style={styles.note}>
        The tuner stays silent and shows no readings until permission is granted.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.text,
    fontFamily: type.condensed,
    fontSize: 26,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontFamily: type.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 440,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  note: {
    color: colors.textMuted,
    fontFamily: type.body,
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 360,
    marginTop: spacing.xs,
  },
});
