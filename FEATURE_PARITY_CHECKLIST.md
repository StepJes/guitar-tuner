# PitchLab Lite — Feature Parity Checklist

Status legend: **DONE** = implemented and verified by unit tests or on the emulator; **BUILD** = implemented, pending the specific on-device/hardware check; **TODO** = not yet implemented or blocked on hardware; **N/A** = external/omitted with rationale.

The checklist is maintained throughout development. A feature is not marked DONE until it has been exercised on the emulator/device and, for audio paths, with a real microphone where available. Final evidence is recorded in `TESTING.md`.

## A. APK analysis deliverables

| ID | Deliverable | Status |
| --- | --- | --- |
| A-01 | APK unpack/decompile and manifest analysis | DONE |
| A-02 | Resource/layout/string/theme analysis | DONE |
| A-03 | Native library symbols/strings analysis | DONE |
| A-04 | Audio path and DSP boundary analysis | DONE |
| A-05 | Feature inventory | DONE |
| A-06 | Screen inventory | DONE |
| A-07 | UI design specification | DONE |
| A-08 | Functional specification | DONE |
| A-09 | Technical architecture | DONE |
| A-10 | Implementation plan | DONE |
| A-11 | Parity checklist maintained | DONE |

## B. Project/build

| ID | Feature | Status |
| --- | --- | --- |
| B-01 | Bare React Native + TypeScript, no Expo | DONE |
| B-02 | React Navigation shell | DONE |
| B-03 | Modular `src/` structure | DONE |
| B-04 | Native Kotlin module registered | DONE |
| B-05 | Android manifest permissions/features | DONE |
| B-06 | Custom app icon/branding (independently created) | DONE |
| B-07 | TypeScript strict build | DONE |
| B-08 | Lint/test pass | DONE |
| B-09 | Debug APK builds | DONE |
| B-10 | Release APK build/signing instructions | DONE |

## C. Startup/lifecycle

| ID | Feature | Status |
| --- | --- | --- |
| C-01 | Boot/loading screen | BUILD |
| C-02 | First-run help dialog | DONE |
| C-03 | Welcome flag persisted | DONE |
| C-04 | Crash/error recovery screen + local log | BUILD |
| C-05 | Keep screen on while tuner active | BUILD |
| C-06 | A4 startup notice | BUILD |
| C-07 | Temperament startup notice | BUILD |
| C-08 | Audio auto start/stop on focus/background | DONE |
| C-09 | Orientation setting applied | DONE |

## D. Tuner shell/navigation

| ID | Feature | Status |
| --- | --- | --- |
| D-01 | Five views present/order | DONE |
| D-02 | Swipe left/right wraparound | DONE |
| D-03 | Animated view transition | DONE |
| D-04 | Long-press view selector | DONE |
| D-05 | View selector incl. Options | DONE |
| D-06 | View mode persisted | DONE |
| D-07 | Unseen-view hint + remaining count | BUILD |
| D-08 | usageMask persisted | BUILD |
| D-09 | Options access from toolbar | DONE |
| D-10 | Audio error overlay | BUILD |
| D-11 | Permission gate for modern Android | DONE |
| D-12 | Debug masks affect rendering/audio | BUILD |

## E. Visualizations (live data, no fake values)

| ID | Feature | Status |
| --- | --- | --- |
| E-01 | Instrument radial strobe | BUILD |
| E-02 | Instrument note/cents/Hz/status | BUILD |
| E-03 | Instrument string indicators + nearest string | BUILD |
| E-04 | Dial & Strobe needle dial | BUILD |
| E-05 | Dial & Strobe genuine linear strobe | BUILD |
| E-06 | Spectrogram scrolling heatmap | BUILD |
| E-07 | Spectrogram note calibration markers | BUILD |
| E-08 | Chords 12×6 grid | BUILD |
| E-09 | Real chord estimation/confidence | BUILD |
| E-10 | BigStrobe giant display | BUILD |
| E-11 | Sharp/flat names applied everywhere | BUILD |
| E-12 | In-tune threshold applied | BUILD |
| E-13 | Reduced-motion fallback | BUILD |

## F. Options — support/instrument

| ID | Feature | Status |
| --- | --- | --- |
| F-01 | Options list sections/descriptions/order | DONE |
| F-02 | Help & Information full text | DONE |
| F-03 | Support email link | BUILD |
| F-04 | Release notes 1.0.0–1.0.22 | BUILD |
| F-05 | Credits | BUILD |
| F-06 | 52 preset instruments complete | DONE |
| F-07 | Preset instrument selection/check/persist | DONE |
| F-08 | Custom instrument list Load/New/Edit/Delete | DONE |
| F-09 | Custom instrument editor 2–12 | BUILD |
| F-10 | Note/octave pickers | BUILD |
| F-11 | Max 100 enforcement | BUILD |
| F-12 | Overwrite confirmation | BUILD |
| F-13 | Delete confirmation | DONE |
| F-14 | ASCII name validation | BUILD |
| F-15 | Custom tuning drives string indicators | DONE |

## G. Options — tuning/display/input/misc

| ID | Feature | Status |
| --- | --- | --- |
| G-01 | A4 stepper ±0.1/±1, 220–880, reset, validation | DONE |
| G-02 | 17 preset temperaments complete | DONE |
| G-03 | Preset temperament selection/check/persist | BUILD |
| G-04 | Custom temperament list Load/New/Edit/Delete | DONE |
| G-05 | Temperament editor 12 offsets ±35/0.1 | BUILD |
| G-06 | Temperament Reset/Cancel/Save/overwrite | BUILD |
| G-07 | Note labels follow sharp/flat in editor | BUILD |
| G-08 | Temperament affects target frequencies | DONE |
| G-09 | Display note names setting | BUILD |
| G-10 | Display in-tune threshold setting | BUILD |
| G-11 | Display orientation setting | DONE |
| G-12 | Sample rates 44/22/11/8 kHz | DONE |
| G-13 | Audio setup failed dialog with rate | BUILD |
| G-14 | Analysis rates H/M/L | DONE |
| G-15 | Compatibility spectrogram texture | DONE |
| G-16 | Compatibility audio setup versions | DONE |
| G-17 | Compatibility audio analysis versions | DONE |
| G-18 | Debug audio/visualizations/textures | BUILD |
| G-19 | Factory reset preserves customs | DONE |
| G-20 | All settings persist | BUILD |

## H. Audio/DSP

| ID | Feature | Status |
| --- | --- | --- |
| H-01 | Real `AudioRecord` microphone capture | DONE |
| H-02 | Mono 16-bit PCM at selected rate | DONE |
| H-03 | FFT spectrum | BUILD |
| H-04 | Accurate fundamental detection (CMNDF) | BUILD |
| H-05 | Low bass detection down to ~30 Hz at 44.1k | BUILD |
| H-06 | Note/octave/cents detection | BUILD |
| H-07 | A4/temperament target mapping | DONE |
| H-08 | Chroma extraction | BUILD |
| H-09 | Polyphonic chord estimation | BUILD |
| H-10 | Per-view live reading cadence by analysis rate | BUILD |
| H-11 | Silence/weak-signal handling (no fake data) | DONE |
| H-12 | Audio error/interruption handling | BUILD |
| H-13 | Clean resource release | DONE |
| H-14 | Background stop/foreground restart | DONE |
| H-15 | Legacy analysis/setup compatibility modes | DONE |
| H-16 | Debug audio-off state | DONE |
| H-17 | Audio latency acceptable for tuning | BUILD |
| H-18 | Real-device mic verification | TODO (hardware pending) |

## I. Data/validation/edge cases

| ID | Feature | Status |
| --- | --- | --- |
| I-01 | Custom caps 100/100 | BUILD |
| I-02 | Instrument note count 2–12 | BUILD |
| I-03 | Temperament offset clamps/rounding | BUILD |
| I-04 | Duplicate names case handling | BUILD |
| I-05 | Empty list disabled actions | BUILD |
| I-06 | Invalid numeric input fallback | BUILD |
| I-07 | Corrupt storage recovery | DONE |
| I-08 | Permission denied/permanent denial | BUILD |
| I-09 | Unsupported sample rate fallback | BUILD |
| I-10 | Rotation with open dialogs | DONE |
| I-11 | Small/large screen responsive layouts | BUILD |
| I-12 | Accessibility labels/live region | BUILD |

## J. Testing evidence

| ID | Test | Status |
| --- | --- | --- |
| J-01 | TypeScript compile | DONE |
| J-02 | ESLint | DONE |
| J-03 | Jest unit tests | DONE |
| J-04 | Debug APK build | DONE |
| J-05 | Cold start/navigation smoke test | DONE |
| J-06 | All options flows | BUILD |
| J-07 | Input validation boundaries | BUILD |
| J-08 | Permission grant/deny | DONE |
| J-09 | Emulator virtual mic / device microphone | TODO (hardware pending) |
| J-10 | Screen sizes/orientations | BUILD |
| J-11 | Background/foreground/interruption | DONE |
| J-12 | Release APK/AAB instructions | DONE |

## K. Deliberate omissions / limitations

| ID | Item | Status |
| --- | --- | --- |
| K-01 | AdMob banner | N/A — external monetisation, no tuning utility |
| K-02 | Play services/licensing | N/A |
| K-03 | Breakpad uploader | N/A — local recovery implemented |
| K-04 | Original `.so` / artwork reuse | N/A — proprietary, independently reimplemented |
| K-05 | Pixel-perfect original screenshots | N/A — ARM-only APK cannot run on available x86_64 emulator; UI reconstructed from analysis |
| K-06 | Simulated tuner data | N/A — prohibited; no fake readings |
