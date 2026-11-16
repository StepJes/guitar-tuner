# PitchLab Lite — Implementation Plan

## Objective

Deliver a bare React Native (TypeScript) Android tuner with verified parity for every discoverable user-facing feature of PitchLab Lite 1.0.22, real microphone/DSP analysis, independently recreated UI and release-ready build documentation.

## Milestones

### M0 — Analysis (complete)
- Unpack APK; inspect manifest/resources/layouts.
- Decompile Java; map activities, settings, editors, audio paths, navigation and hidden gestures.
- Inspect native symbols/strings; confirm view names, chord qualities, note styles and renderer boundaries.
- Write all Phase 1/2 documents.

**Exit criteria:** eight analysis/specification documents exist; no unresolved screen or feature category.

### M1 — Project foundation (complete)
- Scaffold bare RN 0.81.5 + TypeScript.
- Add React Navigation, safe-area, AsyncStorage, SVG.
- Establish theme, typography, responsive helpers, icons.
- Configure package identity, permissions, app icon, orientation capability.
- Implement typed settings schema, defaults, storage validation/migration.
- Implement navigation shell and boot/error boundary.

**Exit criteria:** app launches to a tuner shell; settings survive restart; TypeScript compiles.

### M2 — Native audio/DSP module (implemented; physical-device accuracy pending)
- Register `PitchLabAudio` native module/package.
- Implement `AudioRecord` capture thread, ring buffer and all setup compatibility variants.
- Implement FFT, CMNDF pitch detection, legacy peak detector, spectrum bands, chroma, chord templates, waveform.
- Emit throttled typed readings/statuses; implement stop/release and error handling.
- Add orientation/keep-screen-on helpers.

**Exit criteria:** on a real/emulated mic, readings respond to actual tones with correct note/cents; no fabricated values; resources release cleanly.

### M3 — Tuner core UI (complete)
- Main shell, header, status/permission/error panels, startup notices.
- Swipe pager, long-press selector, view persistence, unseen-view hint.
- Instrument view including radial strobe and string rail.
- Dial & Strobe view.
- BigStrobe view.
- Spectrogram view with history buffer and calibration markers.
- Chords view with live 12×6 grid.
- Reduced-motion and accessibility behavior.

**Exit criteria:** five views render live data, swipe/wrap works, all measurements use real analysis, all modes usable in portrait/landscape.

### M4 — Options and editors (complete)
- Options list with exact sections/descriptions/summaries.
- Help/About including release notes, email, credits.
- Preset instrument/temperament lists.
- Custom instrument/temperament lists and editors with all limits/confirmations.
- A4, Display, Sample Rate, Analysis Rate, Compatibility, Debugging, Factory Reset.
- Persist every setting and apply to active engine/UI.
- Validation of names/numbers/duplicates/caps.

**Exit criteria:** every row and dialog performs its real action; all settings affect behavior; cancellation semantics correct.

### M5 — Integration and hardening (complete; some device failure paths pending)
- Lifecycle/background/interruption handling.
- Audio start-failure dialog and sample-rate recovery.
- Permission gate and permanent denial flow.
- Storage corruption fallback, error boundary/crash log, developer diagnostics.
- Performance tuning: memoisation, quantised spectrogram paths, animation gating.
- Accessibility pass and responsive layout pass.

**Exit criteria:** no dead buttons, no placeholder screens, no unhandled promises; all edge cases show a real state.

### M6 — Testing and parity (automated/emulator complete; physical-device validation pending)
- Unit tests: note math, temperament mapping, validation, storage migration, chord mapping.
- Emulator smoke tests: startup, navigation, dialogs, persistence, rotation.
- Device tests (where hardware available): microphones, instruments, noisy environments, backgrounding, permission denial, low-end/high-end.
- Screen-by-screen UI comparison and update of `FEATURE_PARITY_CHECKLIST.md`.
- Fix gaps; re-run.

**Exit criteria:** checklist items marked DONE only with evidence; documented limitations are explicit.

### M7 — Release (signed APK complete with local key; production key/AAB pending if publishing)
- Production keystore/signing config (user-supplied key).
- R8/ProGuard release build; verify Hermes bundle.
- Build debug APK, release APK, optionally AAB.
- Installation/setup/testing/build documentation.
- Final deliverables audit.

**Exit criteria:** `assembleRelease` succeeds; APK installs and passes smoke tests; no proprietary assets/binaries reused.

## Work breakdown / dependencies

```
M0
 └─ M1 (settings, shell)
     └─ M2 (native DSP)
         └─ M3 (visualizations)
             └─ M4 (options/editors)
                 └─ M5 (integration/hardening)
                     └─ M6 (testing/parity)
                         └─ M7 (release)
```

## Risk register

| Risk | Mitigation |
| --- | --- |
| Original native DSP opaque | Independent well-understood DSP; validate against known frequencies; document algorithm. |
| ARM-only original cannot run on x86_64 emulator | Static analysis + independent recreation; document screenshot limitation. |
| Audio latency varies by device | 8192 window at 44.1k, configurable rates, confidence/status UI, no false precision. |
| RN new-architecture module compatibility | Conventional native module/package with RN 0.81 interop; no per-sample bridge traffic. |
| SVG spectrogram performance | Quantised colour grouping/path batching, 20 Hz data cadence, capped columns. |
| Settings corruption | Schema validation and clamp-on-load; defaults; warning. |
| Duplicate-name/custom editing bugs | Pure reducer functions + unit tests + explicit confirmations. |
| Sample-rate unsupported | Startup error handling with attempted rate and direct recovery. |
| Large-screen/rotation layout issues | Responsive calculations, portrait/landscape smoke tests. |
| Release signing misuse | Debug and release configs documented; template debug signing replaced before release. |

## Definition of done

- All checklist items DONE or explicitly N/A with rationale.
- Real microphone analysis on device, including multiple notes/tunings/settings.
- Every control has a tested effect.
- TypeScript, lint, unit tests, debug and release builds pass.
- Documentation includes setup, build, test and installation instructions.
- No copied proprietary source, assets or `.so`; factual tune data only.

## Progress log

| Date | Milestone | Notes |
| --- | --- | --- |
| 2026-11-15 | M0 | APK unpacked/decompiled; eight docs created. |
| 2026-11-15 | M1 | Bare RN 0.81.5 scaffolded; navigation/storage/SVG dependencies installed. |
| 2026-11-15 | M2 | Kotlin AudioRecord/FFT/pitch/spectrum/chroma/chord module and JS facade implemented. |
| 2026-11-15 | M3 | Five views, swipe pager, selector, permission/error/startup states and reduced-motion handling implemented. |
| 2026-11-15 | M4 | Options, Help, presets, custom editors, compatibility, debugging and factory reset implemented. |
| 2026-11-16 | M5 | Persistence, lifecycle, permission, rotation, crash log and native resource release exercises completed. |
| 2026-11-16 | M6 | `tsc`, lint, 26 Jest tests, release build and emulator smoke matrix completed; physical microphone accuracy pending. |
| 2026-11-16 | M7 | Signed release APK built/installed/verified (v2 signature, versionCode 22); local development key. |

## Current status (2026-11-16)

Android implementation and release packaging are complete. The final release APK is installed and smoke-tested on the x86_64 Android 15 emulator. Automated checks pass, including 5 Jest suites / 26 tests. Physical-device acoustic accuracy and a small set of hardware/destructive failure paths remain unverified; see `FEATURE_PARITY_CHECKLIST.md` `BUILD` items and `PROGRESS.md` for the exact next task.
