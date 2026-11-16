# Development Progress — PitchLab Lite Recreation

Last updated: 16 November 2026
Status: **Android implementation complete; release APK built, signed, installed and smoke-tested. Hardware microphone accuracy validation remains.**

## Completed

- Full APK analysis (manifest, resources, layouts, strings, presets, temperaments, help/release text, audio/DSP boundaries, native symbols).
- Eight required planning/specification documents plus `README.md`, `RELEASE_BUILD.md`, `TESTING.md`.
- Bare React Native 0.81.5 + TypeScript project, no Expo.
- React Navigation 7 shell: `Tuner` and `Options`, with React Native dialogs for editors/settings.
- Five independently recreated tuner views: Instrument, Dial & Strobe, Spectrogram, Chords, BigStrobe.
- Real native Android audio pipeline in Kotlin: `AudioRecord`, FFT spectrum, CMNDF/autocorrelation, chroma, chord scoring, selected analysis/setup compatibility modes.
- 52 preset instruments and 17 preset temperaments, custom instrument/temperament editors, CRUD and persistence.
- Settings: A4, sample rate, analysis rate, sharp/flat note names, threshold, orientation, compatibility, debugging, factory reset.
- First-run Help, permission gate/retry/rationale, audio error UI, startup notices, crash boundary/local log, screen wake, hardware Menu key, usage hints, view persistence.
- Independently generated launcher/adaptive icon assets and branded launch background.
- Release signing with local keystore; release APK verified and installed without Metro.

## Final verification

- `npx tsc --noEmit` — PASS.
- `npm run lint` — PASS, 0 errors / 20 expected warnings.
- `npm test -- --runInBand` — PASS, 5 suites / 26 tests.
- Release build — `BUILD SUCCESSFUL in 5m 27s`.
- Release APK: `android/app/build/outputs/apk/release/app-release.apk`
  - 65,805,590 bytes
  - SHA-256 `16A5EBA580654A96C9C398A6ECB18050CEDDC053773711FCEF34EB7182AB8648`
  - `com.pitchlab.tuner`, versionCode 22, versionName 1.0.22, minSdk 24, targetSdk 36
  - APK Signature Scheme v2 verified, signer `CN=PitchLab`
  - ABIs: arm64-v8a, armeabi-v7a, x86, x86_64
- Installed release over the prior release build; cold launch and launcher-icon launch both work with Metro stopped.
- Verified on `Medium_Phone_API_35` (Android 15, x86_64):
  - first-run Help, permission flow, Options access (gear/hardware Menu), Help from Options;
  - custom instrument/temperament create/save/reset-retention/delete;
  - A4 typed-value commit (`432` then apply), factory reset restoring `440.0`;
  - sample rate 44.1 → 22.05 → 44.1, analysis rate changes, sharp/flat display, threshold, orientation, compatibility texture/audio setup/analysis versions, debug audio off/on;
  - factory reset defaults: A4 440.0, compatibility `Latest / Latest`, debugging `All enabled`, Instrument view, Help shown again;
  - background/foreground audio stop/start confirmed in `dumpsys audio`;
  - dynamic rotation and portrait lock, including rotation with the A4 dialog open;
  - view selector, cyclic swipes, and Spectrogram persistence across force-stop.

Detailed evidence: `TESTING.md`. Per-feature status: `FEATURE_PARITY_CHECKLIST.md`.

## Files changed in the final pass

- `src/components/NumericStepper.tsx` — propagate valid typed values while focused so OK applies the latest edit; normalize on blur.
- `__tests__/numericStepper.test.tsx` — regression test for focused typed-value commit and clamping.
- `TESTING.md` — final automated/build/emulator evidence and limitations.
- `FEATURE_PARITY_CHECKLIST.md` — statuses updated from final evidence.
- Documentation counts corrected from 55 to 52 preset instruments: `README.md`, `APK_ANALYSIS.md`, `FEATURE_INVENTORY.md`, `FEATURE_PARITY_CHECKLIST.md`, `FUNCTIONAL_SPEC.md`, `SCREEN_INVENTORY.md`.
- `PROGRESS.md` — this resume document.

## Current clean state

- Last recorded emulator state before shutdown: portrait, Instrument view, tuner `LISTENING`, A4 `440.0`, Guitar Standard, Equal Tempered. The AVD was shut down after the final verification pass.
- Custom instruments: 0. Custom temperaments: 0.
- Compatibility: `Latest / Latest / 8888`; debugging all enabled.
- Test custom definitions were removed after verifying factory-reset retention.

## Known bugs / blockers

- No known functional code bug outstanding from the final pass.
- Real acoustic pitch/chord/spectrum accuracy is unverified. The emulator opens a real MIC capture session, but the host microphone did not capture a test beep. Test on a physical Android phone with a reference tone/tuner.
- The original APK cannot run on the x86_64 emulator because its native libraries are ARM-only; exact screenshot comparison is unavailable.
- Remaining `BUILD` items in `FEATURE_PARITY_CHECKLIST.md` are hardware/destructive-path checks: live visualizations, permanent permission denial, forced AudioRecord failure, crash boundary, 100-definition caps, overwrite prompts, reduced motion, and small/large screens.
- `npm audit` reports 21 upstream advisories (8 low, 13 moderate); not remediated.
- The release keystore is a local development key. Replace it with a production key before publishing.
- The project is not a Git repository; changes are not committed.

## Exact next task

1. Install the release APK on a physical Android phone.
2. Grant microphone permission and verify real-time Instrument, Dial & Strobe, Spectrogram, Chords, and BigStrobe readings against a reference tone/tuner.
3. Exercise permanent permission denial and forced AudioRecord failure, then the remaining `BUILD` checks listed above.
4. If publishing, replace the local signing key and build a Play-ready AAB.

## Resume commands

```powershell
cd D:\Projects\GuitarTuner
npx tsc --noEmit
npm run lint
npm test -- --runInBand

$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
cd android
.\gradlew.bat assembleRelease --console=plain

adb install -r app\build\outputs\apk\release\app-release.apk
adb shell am start -n com.pitchlab.tuner/com.pitchlabapp.MainActivity
```

Serial for the available emulator: `emulator-5554` (`Medium_Phone_API_35`). Start it with Android Studio or:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd Medium_Phone_API_35 -no-snapshot-load -no-boot-anim -gpu swiftshader_indirect
```
