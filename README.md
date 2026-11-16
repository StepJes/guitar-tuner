# PitchLab Lite (independent React Native recreation)

A bare React Native + TypeScript guitar/instrument tuner reconstructed from the observable behaviour of PitchLab Lite 1.0.22. It uses a real Android microphone pipeline and real DSP; there are no simulated readings or placeholder screens.

## Features

- Five tuner displays: **Instrument**, **Dial & Strobe**, **Spectrogram**, **Chords**, and **BigStrobe**.
- Real `AudioRecord` capture, FFT spectrum, chroma extraction, CMNDF/autocorrelation pitch detection, and chord scoring in Kotlin.
- 52 preset instruments, 17 preset temperaments, custom instrument/temperament editors, A4 calibration, sample-rate and analysis-rate settings, sharp/flat naming, in-tune threshold, orientation, compatibility and debugging options.
- Startup help, audio permission handling, audio-error diagnostics, persistent settings, crash recovery, local crash log, hardware Menu key support, and screen-keep-awake while tuning.
- Independently created launcher/adaptive icon assets and branded launch background.

## Requirements

- Node.js 20 or newer
- JDK 21 (for example Android Studio's bundled JBR)
- Android SDK Platform 36, Build Tools 36.0.0, NDK 27.1.12297006
- Windows: run commands from PowerShell; the Gradle wrapper is committed

## Install dependencies

```powershell
npm install
```

## Run in development

```powershell
# Terminal 1
npm start

# Terminal 2
adb reverse tcp:8081 tcp:8081
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
cd android
.\gradlew.bat assembleDebug
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

The debug APK loads JavaScript from Metro. Use a release build for a standalone APK.

## Quality checks

```powershell
npx tsc --noEmit
npm run lint
npm test -- --runInBand
```

## Release build

See [RELEASE_BUILD.md](RELEASE_BUILD.md) for signing, APK/AAB generation, installation, and verification.

```powershell
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
cd android
.\gradlew.bat assembleRelease
```

The signed APK is written to `android/app/build/outputs/apk/release/app-release.apk`.

## Documentation

- [APK_ANALYSIS.md](APK_ANALYSIS.md)
- [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md)
- [SCREEN_INVENTORY.md](SCREEN_INVENTORY.md)
- [UI_DESIGN_SPEC.md](UI_DESIGN_SPEC.md)
- [FUNCTIONAL_SPEC.md](FUNCTIONAL_SPEC.md)
- [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)
- [FEATURE_PARITY_CHECKLIST.md](FEATURE_PARITY_CHECKLIST.md)
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
- [TESTING.md](TESTING.md)
- [RELEASE_BUILD.md](RELEASE_BUILD.md)
- [PROGRESS.md](PROGRESS.md)

## Project layout

```text
src/
  components/        shared UI and error/permission states
  constants/         presets and theme
  features/options/  settings dialogs and editors
  features/tuner/    five live displays and reading presentation
  hooks/             strobe/reduced-motion hooks
  native/            Kotlin audio module facade
  navigation/        React Navigation native stack
  screens/           Tuner and Options screens
  services/          settings, audio engine, crash log
  types/             settings/audio contracts
  utils/             note, colour, validation helpers
android/app/src/main/java/com/pitchlabapp/audio/
                     AudioRecord, FFT, pitch, spectrum, chroma, chord DSP
```

## Notes and limitations

- The supplied original APK contains only ARM native libraries and cannot run on the available x86_64 emulator; pixel-perfect comparison against the original was therefore not possible. UI and behaviour were reconstructed from decompiled resources and code analysis.
- Real microphone accuracy still needs validation on physical hardware. The emulator's virtual microphone can exercise the pipeline but cannot prove tuning accuracy.
- The generated `android/app/pitchlab-release.keystore` is a local development release key. Replace it with your own protected production key before publishing.
- `npm audit` reports upstream development-dependency advisories; they do not affect the runtime audio path but should be reviewed before distribution.