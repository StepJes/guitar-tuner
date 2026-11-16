import React from 'react';
import {Alert, Clipboard, Linking, Pressable, StyleSheet, Text, View} from 'react-native';
import {DialogModal} from '../../components/DialogModal';
import {AppButton} from '../../components/AppButton';
import {colors, spacing, type} from '../../constants/theme';

export const SUPPORT_EMAIL = 'pitchlabapp@gmail.com';

const RELEASE_NOTES = [
  '1.0.22: Updated feature set to avoid potential patent issues.',
  '1.0.21: Improved error checking to fix intermittent crashes.',
  '1.0.20: Integrated ads to support the free version.',
  '1.0.19: Improved audio-error recovery instructions. Updated title page.',
  '1.0.18: Fixed 5-string banjo tunings.',
  '1.0.17: Updated title page.',
  '1.0.16: Updated audio analysis to cover bass instruments. Reworked Partials display. Added Bass Guitar tunings.',
  '1.0.15: Fixed Guitar/Open D tuning. Reworked audio setup.',
  '1.0.14: Added text hint when tuning views have not been accessed.',
  '1.0.13: Added instrument tuner visualization, tuning database and user-defined tuning editor. Added orientation lock. Improved flat notation.',
  '1.0.12: Fix for corrupted 1.0.11 release.',
  '1.0.11: Added crash detection and logging. Added debug options. Fixed an intermittent crash on HTC One X.',
  '1.0.10: Graphics compatibility fix for Galaxy S2.',
  '1.0.9: Reworked audio setup. Added BigStrobe visualization. Added sharp/flat notation.',
  '1.0.8: Added Partials visualization (later removed).',
  '1.0.7: Reworked audio setup and layout tweaks.',
  '1.0.6: Fixed responsiveness issue on Nexus 7.',
  '1.0.5: Compatibility tweaks and tablet layouts.',
  '1.0.4: Fixed Bluetooth security violation when unmuting the microphone.',
  '1.0.3: Improved text clarity on smaller screens.',
  '1.0.2: Defaults to 32-bit textures for Chromatic Tiles and Spectrogram displays.',
  '1.0.1: Improved display contrast and updated credits.',
  '1.0.0: Initial release.',
];

interface HelpDialogProps {
  visible: boolean;
  onClose: () => void;
  firstRun?: boolean;
}

function Section({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Paragraph({children}: {children: React.ReactNode}) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

export function HelpDialog({visible, onClose, firstRun}: HelpDialogProps) {
  const openEmail = async () => {
    const url = `mailto:${SUPPORT_EMAIL}?subject=PitchLab%20Lite%20support`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // Fall through to copy.
    }
    try {
      Clipboard.setString(SUPPORT_EMAIL);
      Alert.alert('Email address copied', `${SUPPORT_EMAIL} is ready to paste into your mail app.`);
    } catch {
      Alert.alert('Support email', SUPPORT_EMAIL);
    }
  };

  return (
    <DialogModal
      visible={visible}
      title="PitchLab 1.0.22"
      subtitle="digital chromatic tuner"
      onClose={onClose}
      footer={
        <AppButton
          label={firstRun ? 'Start tuning' : 'Close'}
          variant="primary"
          onPress={onClose}
          style={styles.footerButton}
        />
      }>
      <Text style={styles.lead}>
        Welcome to PitchLab, a general-purpose chromatic tuner and pitch visualization tool.
      </Text>

      <Section title="Quick start">
        <Paragraph>
          Change visualization mode by swiping the screen left or right, or by pressing and holding
          the current display to open the view selection menu.
        </Paragraph>
        <Paragraph>
          Open Options with the gear button or by selecting “Options” from the view menu. Needle
          displays show the deviation in cents from true tuning.
        </Paragraph>
        <Paragraph>
          Strobe displays provide precise feedback near true tuning: a strobe moving left means the
          analysed note is flat; moving right means it is sharp.
        </Paragraph>
        <Paragraph>
          Spend some time with each visualization while playing single notes. The Chords view needs
          multiple simultaneous notes, so try a few chords on your instrument.
        </Paragraph>
      </Section>

      <Section title="Visualization modes">
        <Paragraph>
          <Text style={styles.bold}>Instrument:</Text> radial strobe with string/note indicators and
          tunings for guitar, violin/fiddle, mandolin, ukulele, banjo, bouzouki and pedal steel.
        </Paragraph>
        <Paragraph>
          <Text style={styles.bold}>Dial &amp; Strobe:</Text> combination dial tuner and linear strobe
          for rapid, hands-free tuning.
        </Paragraph>
        <Paragraph>
          <Text style={styles.bold}>Spectrogram:</Text> scrolling live sound analysis for instruments
          and voices.
        </Paragraph>
        <Paragraph>
          <Text style={styles.bold}>Chords:</Text> grid estimate of major, minor, seventh and
          diminished chord types.
        </Paragraph>
        <Paragraph>
          <Text style={styles.bold}>BigStrobe:</Text> a large single strobe optimized for small
          screens.
        </Paragraph>
      </Section>

      <Section title="Instrument and temperament editor">
        <Paragraph>
          Press “New” to create a custom definition, edit its name and values, then save. Use Load,
          Edit or Delete to manage existing definitions.
        </Paragraph>
        <Paragraph>
          Copy a custom definition by editing its name and saving under the new name; the old copy
          can then be deleted if required.
        </Paragraph>
      </Section>

      <Section title="Compatibility">
        <Paragraph>
          If Spectrogram or note calibration markers do not line up, switch the Spectrogram texture
          format to RGBA-5551 in Compatibility options.
        </Paragraph>
        <Paragraph>
          If PitchLab reports a sample-rate error, try a different Audio Setup compatibility version.
          One of the versions may work on your device.
        </Paragraph>
      </Section>

      <Section title="Performance">
        <Paragraph>
          If displays are slow, lower the sample rate to 22 kHz. If that is not enough, set Analysis
          Rate to Low or choose an even lower sample rate.
        </Paragraph>
      </Section>

      <Section title="Bugs and crashes">
        <Paragraph>
          Use Debugging options to disable internal functions and narrow down an issue. Crash
          diagnostics are stored locally in app storage.
        </Paragraph>
      </Section>

      <Section title="Credits">
        <Paragraph>Bitmap artist: Rob James, www.gomobli.com.</Paragraph>
        <Paragraph>
          Google Breakpad: Copyright (c) 2006, Google Inc. All rights reserved. Breakpad is not
          included in this independent React Native recreation.
        </Paragraph>
      </Section>

      <Section title="Support">
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Email support at ${SUPPORT_EMAIL}`}
          onPress={openEmail}
          style={({pressed}) => [styles.mailRow, pressed && styles.pressed]}>
          <Text style={styles.mail}>{SUPPORT_EMAIL}</Text>
        </Pressable>
        <Paragraph>
          Include your device model, Android version and the selected sample rate when reporting a
          problem.
        </Paragraph>
      </Section>

      <Section title="Release notes">
        {RELEASE_NOTES.map(note => (
          <Text key={note.slice(0, 8)} style={styles.releaseNote}>
            {note}
          </Text>
        ))}
      </Section>

      <Text style={styles.recreation}>
        This independent React Native recreation implements the 1.0.22 feature set. Original
        proprietary artwork, fonts and native code are not included.
      </Text>
    </DialogModal>
  );
}

const styles = StyleSheet.create({
  lead: {
    color: colors.text,
    fontFamily: type.body,
    fontSize: 14,
    lineHeight: 21,
  },
  section: {
    gap: 6,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    color: colors.accent,
    fontFamily: type.condensed,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  paragraph: {
    color: colors.textSecondary,
    fontFamily: type.body,
    fontSize: 13,
    lineHeight: 19,
  },
  bold: {
    color: colors.text,
    fontWeight: '700',
  },
  mailRow: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.accentDim,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  mail: {
    color: colors.accent,
    fontFamily: type.mono,
    fontSize: 13,
  },
  releaseNote: {
    color: colors.textMuted,
    fontFamily: type.body,
    fontSize: 11,
    lineHeight: 16,
  },
  recreation: {
    color: colors.textMuted,
    fontFamily: type.body,
    fontSize: 10,
    lineHeight: 15,
    fontStyle: 'italic',
    paddingTop: spacing.xs,
  },
  footerButton: {
    flex: 1,
  },
  pressed: {
    opacity: 0.65,
  },
});
