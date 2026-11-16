# PitchLab Lite — Technical Architecture

## 1. Stack

| Layer | Choice | Reason |
| --- | --- | --- |
| Runtime | React Native 0.81.5 (bare, TypeScript) | Required no Expo; New Architecture-capable. |
| UI | React 19 functional components + hooks | Modern state and effects. |
| Navigation | React Navigation 7 native stack + safe-area context | Stable two-destination shell plus accessible modal stack. |
| Drawing | `react-native-svg` | Declarative, hardware-accelerated vector drawing for five visualizations without proprietary assets. |
| Persistence | `@react-native-async-storage/async-storage` | Settings/custom definitions; simple, lifecycle-safe. |
| Audio/DSP | Kotlin native module (`PitchLabAudio`) | Real microphone input and real-time FFT/autocorrelation; no JS bridge per sample. |
| Android UI integration | Native module for orientation, keep-screen-on, permission check | Settings that must affect the Activity/window. |
| Build | Gradle 8.14.3, AGP via RN template, JDK 21, minSdk 24, target/compile 36 | Current toolchain. |
| Testing | Jest + TypeScript + Android emulator/device manual matrix | Unit tests for pure logic and on-device audio/UI verification. |

Expo is deliberately not used.

## 2. Directory layout

```
src/
  audio/
    AudioEngineContext.tsx     # JS lifecycle + native events
    format.ts                  # frequency/cents helpers (UI-safe)
  components/
    AppButton.tsx
    AppHeader.tsx
    Dialog.tsx
    DialogScreen.tsx
    EmptyState.tsx
    Icon.tsx
    OptionRow.tsx
    PermissionGate.tsx
    Screen.tsx
    SectionHeader.tsx
    StatusBanner.tsx
    Stepper.tsx
    ValuePill.tsx
    ViewSelector.tsx
  constants/
    colors.ts
    layout.ts
    presets.ts                 # factual preset instruments/temperaments
    strings.ts
    views.ts
  features/
    options/...                # option list, dialogs, editors, validation
    tuner/...                  # view pager + five visualizations
  hooks/
    useAppStateAudio.ts
    useFirstRun.ts
    useReduceMotion.ts
    useSettings.ts
  navigation/
    RootNavigator.tsx
    types.ts
  native/
    PitchLabAudio.ts           # typed NativeModules facade/events
  screens/
    TunerScreen.tsx
    OptionsScreen.tsx
    CrashRecoveryScreen.tsx
  services/
    settingsStorage.ts
    crashLog.ts
  types/
    audio.ts
    settings.ts
    instrument.ts
  utils/
    notes.ts
    validation.ts
    math.ts
  App.tsx
index.js
android/
  app/src/main/java/com/pitchlabapp/
    MainActivity.kt
    MainApplication.kt
    audio/
      PitchLabAudioModule.kt
      PitchLabAudioPackage.kt
      AudioEngine.kt
      Fft.kt
      PitchDetector.kt
      SpectrumAnalyzer.kt
      ChordAnalyzer.kt
```

Business logic lives outside view components. Native DSP produces a plain serialisable reading; JS only formats and draws.

## 3. State architecture

### Settings provider
- `SettingsProvider` owns a single immutable `Settings` object plus `revision`.
- Loads AsyncStorage once at boot with schema validation/migration.
- `update(patch)` merges, clamps/sanitises, increments revision, persists debounced, and notifies consumers.
- `replaceCustomInstruments/Temperaments` are atomic operations.
- `resetSettings()` preserves custom arrays but resets all other fields.
- No global mutable singleton; context exposes typed actions.

### Audio provider
- `AudioProvider` receives settings and provides `{reading, status, error, start, stop, retry, requestPermission}`.
- It does not create capture until a consumer calls `start`, so Options/background are silent.
- Native event listeners are attached once and filtered by config revision/timestamp.
- Start uses a monotonically increasing session id; events from old sessions are dropped.
- Status errors are exposed as typed objects and rendered by the tuner.

### Derived selectors
- `resolveInstrument(settings)` → preset or custom, fallback standard.
- `resolveTemperament(settings)` → preset or custom, fallback equal tempered.
- `instrumentNotes` and `temperamentCents` are passed to native at start and included in reading interpretation.
- `noteName(midi, style)` and `formatCents` are pure and unit-tested.

## 4. Navigation

`RootNavigator` (native stack):
- `Tuner` — header hidden; custom top bar.
- `Options` — header hidden; custom header/back.
- Settings dialogs: React Native `Modal` layers rendered by Options, not separate navigation destinations. This mirrors Android's dialog stack, keeps draft state local, and prevents accidental navigation loss. The modal helper handles:
  - transparent backdrop + focus trapping,
  - hardware back/escape,
  - scrollable card,
  - equal-weight footer actions,
  - safe-area/keyboard avoidance.

The tuner is not remounted when Options opens; settings revision triggers engine restart on return.

## 5. Audio pipeline (Kotlin)

```
PitchLabAudioModule.start(config, promise)
  → validates config, stops old engine
  → AudioEngine.start()
      AudioRecord init/getMinBufferSize/startRecording
      capture thread reads short[] into ring buffer
      every hop:
        window = last N samples
        Fft.forward(power spectrum)
        PitchDetector.detect(window, sampleRate, version)
        SpectrumAnalyzer.bands(spectrum)
        ChordAnalyzer.estimate(chroma)
        ReadingBuilder → JSON/WritableMap
      Module emits "PitchLabAudio.reading" on the RN device-event emitter
      Module emits "PitchLabAudio.status" for start/stop/errors
PitchLabAudioModule.stop() → engine.stopAndRelease()
```

### Threading
- Capture and DSP on a dedicated `HandlerThread`/worker thread.
- JS event emission marshalled to main thread through `Handler(Looper.getMainLooper())`.
- No allocation-heavy per-frame work where avoidable; pre-allocate FFT arrays and reading buffers.
- Cancellation via `AtomicBoolean` + interrupted thread; `AudioRecord.stop()` then `release()` in `finally`.

### Native payload

```ts
interface NativeReading {
  frequency: number;         // Hz, 0 when none
  midi: number;              // nearest note
  cents: number;             // target-relative
  confidence: number;        // 0..1
  rms: number;               // 0..1 scaled
  noteName: string;          // native sharp naming; JS re-spells for flat
  stringIndex: number;       // -1 if none
  spectrum: number[];        // 96 values
  chroma: number[];          // 12 values
  waveform: number[];        // 128 values
  chordRoot: number;         // 0..11, -1 none
  chordQuality: string;      // maj|min|maj7|min7|dom7|dim7
  chordName: string;
  chordConfidence: number;   // 0..1
  chordScores: number[];     // flattened 72
  timestamp: number;
  sampleRate: number;
  sessionId: number;
}
```

### FFT
- Iterative radix-2 Cooley–Tukey, in-place, precomputed bit-reversal and twiddle tables per size.
- Forward/reverse transforms; autocorrelation via `IFFT(|FFT(x)|²)`.
- Sizes: 2048, 4096, 8192, 16384 (pitch FFT uses next power of two ≥ 2×window where required).

### Pitch detector
- Latest: Hann window, CMNDF, 25–5000 Hz, sub-sample parabolic interpolation.
- 1.0.15 compatibility: interpolated spectral peak with harmonic reinforcement.
- Outputs frequency + confidence only; note/temperament mapping done in the same module with config to avoid stale JS calculations.

### Chord detector
- Spectral peaks → 12-bin chroma (harmonic/percussive noise suppression).
- 72-template match; confidence gating.
- Emits flattened scores for the grid.

## 6. Rendering architecture

- `TunerScreen` owns the active view index and swipe `Animated.Value`.
- Each visualization is a memoised component receiving `reading`, `settings`, `size`, `active`.
- SVG is used for arcs, ticks, strobe rings, needles, spectrogram cells and grid. Large groups are built as path strings to minimise node count.
- Spectrogram history is a 72×96 `Float32Array` ring buffer; React state holds an immutable version snapshot at analysis cadence. Rendering converts bands to quantised colour groups and emits a handful of path elements.
- Strobe components run a `requestAnimationFrame` loop only while focused and not reduced-motion; they compute phase from `performance.now()` and measured cents. No loop when no signal (bars hold).
- `React.memo` and stable callbacks avoid re-rendering the whole options tree on audio events.
- Use `useWindowDimensions`, safe-area insets, and `PixelRatio` for responsive geometry.
- The native DSP is the sole source of measurements; SVG has no synthetic noise.

## 7. Lifecycle

| Event | Action |
| --- | --- |
| App launch | load settings → show boot → first-run help → main |
| Main focus | request/verify permission → start engine → keep screen on → apply orientation |
| Main blur | stop engine → release screen-on |
| App background | stop engine; clear reading |
| App foreground | if main focused, restart |
| Settings commit | persist; if DSP-relevant, bump revision and restart engine |
| Orientation setting | native requested orientation; React layout adapts |
| Options open | main loses focus; engine stops |
| Audio error | status error; no reading; retry/change rate actions |
| Unmount | remove event subscriptions; stop native engine |

## 8. Permissions and Android integration

Manifest:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS"/>
<uses-permission android:name="android.permission.WAKE_LOCK"/>
<uses-feature android:name="android.hardware.microphone" android:required="true"/>
```
No storage permission is requested for tuner operation; crash logs use app-internal storage.

Native module helpers:
- `setOrientation(mode)` → ActivityInfo screen orientation constants.
- `setKeepScreenOn(enabled)` → run on UI thread; `FLAG_KEEP_SCREEN_ON`.
- `isMicrophoneAvailable()` optional check.
- Permission requested from JS via `PermissionsAndroid` so rationale/denial UI stays in React.

## 9. Error handling

- **Error boundary** wraps the app; stores timestamp, message, stack and settings revision in an internal file; renders recovery screen.
- **Storage errors** fall back to defaults; a warning is surfaced in Options/Help.
- **Native module missing** (e.g. wrong build) → typed error and visible developer message instead of crash.
- **Audio errors** → status + actionable dialog.
- **Invalid persisted custom data** is dropped/clamped item-by-item; defaults used.
- **Navigation errors** impossible by typed params; dialog state is self-contained.

## 10. Performance targets

| Metric | Target |
| --- | --- |
| Audio analysis | 44.1 kHz, 8192 window, High ≈20 Hz |
| JS UI update | ≤ 20 readings/s, memoised |
| Strobe animation | 30–60 fps on mid-range device |
| Cold start | < 2.5 s to interactive |
| Settings write | debounced 300 ms, < 5 ms main-thread cost |
| Memory | < 120 MB typical; no unbounded history |
| Battery | no analysis while backgrounded/Options |

## 11. Security/privacy

- Microphone audio is processed in memory only; never persisted or sent.
- No network calls for tuning. Internet permission may remain for dev tooling; production build can omit it and still function.
- Custom definitions are local.
- No analytics or ads.
- Native code validates all config lengths and ranges to avoid crashes from malformed JS input.

## 12. Build and release

- Bare Android project, Gradle wrapper from RN 0.81.5.
- Set JDK 21 (`org.gradle.java.home` or `JAVA_HOME`).
- Signed release uses a user-generated keystore; the template debug signing must be replaced before publishing.
- Hermes enabled, ProGuard/R8 optional for release.
- Supported ABIs: arm64-v8a, armeabi-v7a, x86_64 (emulator). No proprietary `.so`.
- CI steps: `npm ci`, `npm run lint`, `npm test`, `cd android && ./gradlew assembleRelease`.

## 13. Trade-offs / documented limitations

- Original used a single native OpenGL renderer; the recreation uses SVG + native DSP. This preserves behavior and performance while avoiding reuse of proprietary binaries/assets.
- New Architecture-capable RN is used; the audio bridge is a conventional native module for compatibility across legacy/new bridge modes. No sample-level data crosses the bridge.
- Android's audio latency and microphone response vary by device; window/hop tuning and status messages make this explicit.
- Legacy ads/Play services are intentionally omitted.
