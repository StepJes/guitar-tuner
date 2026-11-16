# Testing and Verification

## Automated checks

Run from the project root:

```powershell
npx tsc --noEmit
npm run lint
npm test -- --runInBand
```

The Jest suite covers:

- Public app render smoke test.
- Note/pitch conversion, temperament offsets, note-list parsing, display formatting.
- Settings repair, A4/name/note validation, custom instrument/temperament resolution, overwrite and history-cap rules, factory-reset preservation.
- Tuner reading presentation for silence, in-tune, flat, sharp, note style, temperament target frequency, and chord labels.

## Build verification

```powershell
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
cd android
.\gradlew.bat assembleDebug
.\gradlew.bat assembleRelease
```

A release build must contain the JS bundle and launch without Metro.

## Emulator/device smoke matrix

Record the device/emulator, Android version, and date for each run.

| Area | Check | Expected result |
| --- | --- | --- |
| Startup | Cold launch, release APK, Metro stopped | Boot screen then tuner UI; no red screen or crash |
| Startup | First launch Help | Help text visible; release notes and support address shown; dismiss returns to tuner |
| Permission | Deny microphone permission | Explanatory gate; no fake reading |
| Permission | Grant microphone permission | Audio starts; listening state until sound input |
| Permission | Permanently denied permission | Gate offers Open Settings and Settings opens app page |
| Audio | Silent input | No fabricated note/frequency; listening state |
| Audio | Tone/music input | Real frequency, note, cents, confidence, spectrum/chroma update |
| Views | Instrument view | Instrument notes/strings render and track |
| Views | Dial & Strobe | Dial needle and strobe respond to pitch; in-tune threshold respected |
| Views | Spectrogram | Live scrolling spectrum renders without layout errors |
| Views | Chords | Chord label/confidence render from real chroma |
| Views | BigStrobe | Large strobe responds and remains legible |
| Views | View selector | Tapping selector and horizontal swipe cycle all five views |
| Views | Long press selector | View menu opens and selects requested view |
| Options | Open via gear and hardware Menu key | Options screen opens; Back returns to tuner |
| Options | Instrument picker | Preset selection persists after restart |
| Options | Custom instrument editor | Add/delete/reorder notes, validate name/note count, save, select, persist |
| Options | Duplicate custom name | Overwrite confirmation; saved definition replaces old entry |
| Options | Temperament picker | Preset selection persists after restart |
| Options | Custom temperament editor | Twelve cents values, clamp/validation, save, select, persist |
| Options | A4 dialog | Accepts 220–880; clamps/validates; persists |
| Options | Sample rate | All options selectable; audio restarts without crash |
| Options | Analysis rate | High/Medium/Low selectable; audio restarts |
| Options | Note names sharp/flat | Display updates across views |
| Options | In-tune threshold | 5/10/15 cents changes in-tune state at same reading |
| Options | Orientation | Dynamic/portrait/landscape applies without losing state |
| Options | Compatibility settings | Values persist and are passed to native start config |
| Options | Debugging | Audio-input switch disables/enables audio; debug mask persists |
| Options | Factory reset | Confirmation; defaults restored; custom definitions preserved |
| Persistence | Kill/relaunch | View, tuning, temperament, A4, display and orientation persist |
| Lifecycle | Background/foreground | Audio stops/starts cleanly; no duplicate sessions or crashes |
| Rotation | Rotate device in dynamic mode | Layout adapts; no clipped controls |
| Error handling | Revoke permission while running or force AudioRecord failure | Actionable error banner/retry, not a blank screen |
| Crash handling | Simulated JS error path | Error boundary/crash log fallback remains usable |
| Branding | Launcher/adaptive icon and splash | Branded assets display without placeholder/default icon |

## Results

### Final verification — 16 November 2026

Environment: `Medium_Phone_API_35` AVD (Android 15, x86_64), release APK installed over the previous release-signed build, Metro not running.

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS, no diagnostics |
| `npm run lint` | PASS, 0 errors / 20 warnings (expected bitwise and shadow-name warnings) |
| `npm test -- --runInBand` | PASS, 5 suites / 26 tests |
| `assembleRelease` | PASS in 5m 27s; bundled JS, no Metro required |
| Release install/launch | PASS over previous release; cold start and launcher-icon start both reached the tuner |
| A4 typed-value regression | PASS; `432` entered while focused, keyboard hidden, OK applied `432.0 Hz`; reset later restored `440.0 Hz` |
| Factory reset | PASS; confirmation shown, Help returned, Instrument view restored, A4 `440.0`, compatibility `Latest / Latest`, debugging `All enabled` |
| Custom-definition retention | PASS; created one custom instrument and one custom temperament, factory reset retained both (`1 saved`), then delete confirmations removed both (`0 saved`) |
| Background/foreground | PASS; `dumpsys audio` recorded `rec stop` on Home and a new recording session on resume; tuner returned to `LISTENING` with no duplicate UI |
| Rotation with open dialog | PASS; A4 dialog remained open and usable when rotated portrait → landscape → portrait, then Cancel returned to Options |
| View behavior | PASS; view selector listed five views plus Options; Spectrogram selection survived force-stop/relaunch; swipe wraparound `Instrument → BigStrobe → Chords` and back worked |
| Earlier smoke coverage retained | PASS; first-run Help, permission deny/retry/rationale/grant, hardware Menu key, preset/custom instrument and temperament CRUD, sample-rate/analysis-rate changes, sharp/flat naming, compatibility versions/texture, debug audio off/on, portrait lock and dynamic landscape |
| Release metadata | `com.pitchlab.tuner`, versionCode 22, versionName 1.0.22, minSdk 24, targetSdk 36, label `PitchLab Lite`, ABIs `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64` |
| Release signature | PASS; APK Signature Scheme v2, one signer, `CN=PitchLab` |
| Release artifact | `android/app/build/outputs/apk/release/app-release.apk`, 65,805,590 bytes, SHA-256 `16A5EBA580654A96C9C398A6ECB18050CEDDC053773711FCEF34EB7182AB8648` |

### Known limitations

- Physical microphone accuracy and real acoustic tuning cannot be proven on the emulator. The emulator opened a real MIC capture session, but the host microphone did not capture a test beep, so live pitch/chord/spectrum values were not demonstrated end-to-end. Validate on a real Android phone with a reference tuner or tone generator.
- The original APK's native libraries are ARM-only, so it cannot be executed on the available x86_64 emulator for side-by-side screenshot comparison. Feature/UI parity was reconstructed from static APK analysis.
- Hardware-only and destructive error paths that remain marked `BUILD` in `FEATURE_PARITY_CHECKLIST.md` (for example permanent permission denial, forced AudioRecord failure, crash boundary, 100-definition caps) still need device-level exercise.
- `npm audit` currently reports upstream dependency advisories; they should be reviewed before a production release.
