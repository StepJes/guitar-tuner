# PitchLab Lite 1.0.22 — APK Analysis

## 1. Source and scope

| Item | Value |
| --- | --- |
| Analysed file | `PitchLab Lite.apk` |
| Package | `com.symbolic.pitchlab` |
| Version | `1.0.22` (versionCode 22) |
| Display name | PitchLab (launcher); PitchLab Lite in stores |
| Size | 1,149,083 bytes |
| Minimum SDK | Android 2.3 (Gingerbread, API 9) |
| Architectures | `armeabi` (ARMv5/ARMv6-compatible, 32-bit) |
| Main UI technology | Java Activity + `GLSurfaceView` + native C++/OpenGL ES 1.0 renderer |
| Audio transport | `AudioRecord`, mono 16-bit PCM, delivered directly to JNI |
| State | `SharedPreferences` (`com.symbolic.pitchlab.settings`) |
| Ads | Google AdMob banner (Lite build) |
| Analytics / crash reporting | Google Play services + Breakpad native crash handler |

The APK was unpacked with APKTool 2.11.1 and decompiled with JADX 1.5.1. Resources, manifest, native symbols and native strings were inspected. The original native library is stripped, so reconstruction is based on the Java/JNI boundary, native symbol names, embedded native strings, resource layouts, in-app help and independent DSP implementation.

> The recreaction does not copy the original native `.so`, artwork or compiled code. Factual tuning/temperament data observed in the app is re-entered as data, and every screen is reimplemented independently.

## 2. Manifest and platform configuration

### Permissions

| Permission | Purpose |
| --- | --- |
| `android.permission.RECORD_AUDIO` | Real-time microphone capture |
| `android.permission.MODIFY_AUDIO_SETTINGS` | Briefly unmute/configure microphone before capture |
| `android.permission.WAKE_LOCK` | Keep CPU/screen available while tuning |
| `android.permission.WRITE_EXTERNAL_STORAGE` | Legacy crash-log output |
| `android.permission.INTERNET` | AdMob/Play services |
| `android.permission.ACCESS_NETWORK_STATE` | AdMob availability |

### Features and compatibility

- `android.hardware.microphone` is **required**.
- OpenGL ES 1.0 is required.
- All screen densities are supported.
- The activity handles configuration changes (`keyboardHidden`, `orientation`, `screenSize`) itself.
- No services, content providers or broadcast receivers are declared in the application package.
- No exported deep links or intent filters other than the launcher.

### Activities

| Activity | Role |
| --- | --- |
| `ActivityCrashlogs` | Launcher/process bootstrap. Initialises crash logging, native library and application state. Closes immediately and opens the welcome flow/main UI. |
| `ActivityWelcome` | One-time help/about dialog, then opens `ActivityVisualiser`. Uses an empty placeholder layout while the dialog is shown. |
| `ActivityVisualiser` | The tuner. A full-screen native `GLSurfaceView` with swiping, long-press view selection and Menu-key options. |
| `ActivityOptions` | Full-screen settings/options list, with modal dialogs for every setting and editor. |

The launcher-first crash-log activity explains why the launcher label is “crashlogs” internally even though users see a tuner.

## 3. Application structure

### Java layer (selected classes)

| Obfuscated class | Responsibility |
| --- | --- |
| `PitchLabNative` | Loads `libPitchLab.so`; declared JNI methods for initialisation, sample streaming, analysis parameters, surface lifecycle, frame drawing, view names, note-name titles and pause. |
| `ActivityVisualiser` | Audio lifecycle, orientation, wake lock, view pager surface, ad banner, long-press selector, Menu handling, startup notices. |
| `C0949cj` | Custom `GLSurfaceView`; fling detection, long-press handler, renderer scheduling. |
| `C0952cm` | GL renderer: computes current view, usage mask and calls `drawFrame`. |
| `GestureDetectorOnGestureListenerC0951cl` | Horizontal fling navigation between the five views. |
| `C0943cd` | Global settings model and SharedPreferences persistence. |
| `C0941cb` | Instrument tuning model, 52 presets and custom serialization. |
| `C0944ce` | Temperament model, 17 presets and custom serialization. |
| `C0937by` | Note-name parsing/formatting, sharp/flat tables, MIDI-like note numbers. |
| `C0928bp` | Chooses a microphone setup implementation based on compatibility settings. |
| `C0929bq`, `C0931bs`, `C0933bu` | Three generations of `AudioRecord` capture code. |
| `C0935bw` | Debug/simulated audio source used when Audio Input is disabled. |
| `C0934bv` | Capture thread; sends short PCM blocks, sample count and sample rate to JNI. |
| `ActivityOptions` | All settings dialogs and list items. |
| `C0938bz` | Help text, release notes, support email and dialog builder. |
| `C0908aw` | Custom instrument editor. |
| `C0915bc` | Custom temperament editor. |
| `C0958cs` | Reusable numeric stepper with min/max/clamp/step. |

### Native layer

`libPitchLab.so` exports 474 dynamic symbols, including the JNI entry points:

```
Java_com_symbolic_pitchlab_PitchLabNative_initialiseNative
Java_com_symbolic_pitchlab_PitchLabNative_processStreamedSamples
Java_com_symbolic_pitchlab_PitchLabNative_setAnalysisParameters
Java_com_symbolic_pitchlab_PitchLabNative_surfaceCreated
Java_com_symbolic_pitchlab_PitchLabNative_surfaceChanged
Java_com_symbolic_pitchlab_PitchLabNative_drawFrame
Java_com_symbolic_pitchlab_PitchLabNative_getNumViews
Java_com_symbolic_pitchlab_PitchLabNative_getViewName
Java_com_symbolic_pitchlab_PitchLabNative_getViewBit
Java_com_symbolic_pitchlab_PitchLabNative_getNumNoteNames
Java_com_symbolic_pitchlab_PitchLabNative_getNoteNameTitle
Java_com_symbolic_pitchlab_PitchLabNative_clickFrame
Java_com_symbolic_pitchlab_PitchLabNative_appPaused
```

The last two (`getViewBit`, `clickFrame`) are not used by the Java wrapper in this build. The renderer uses OpenGL ES 1.0, built-in textures/fonts and embedded bitmap resources. Native strings identify the renderer states/assets:

```
English (sharp)
English (flat)
Instrument
Dial & Strobe
Spectrogram
Chords
BigStrobe
Title
Font
AudioError
AppIcon
PITCHLAB
IN TUNE!
 TUNE UP
TUNE DOWN 
(%d REMAINING)
SWIPE SCREEN LEFT/RIGHT
PitchLab PRO now available
on Google Play.
digital chromatic tuner
Audio Error!
...
maj / maj7 / dom7 / min / min7 / dim7
```

These strings confirm there are exactly five visualizations and that the chord grid uses six qualities.

### Native processing observations

- Audio is streamed as raw `short[]` PCM, not recorded to a file.
- `setAnalysisParameters` receives instrument name, an int array of target notes, twelve temperament cents values, A4 reference, in-tune threshold, an analysis-rate flag (`4/8/16` for Low/Medium/High) and an analysis-version flag.
- `drawFrame` receives view index, screen offset for swipe animation, texture format, note-name style and an encoded value containing the unseen-view count and debug mask.
- `getNumViews = 5`, `getViewName` returns the five names above, `getNumNoteNames = 2`.
- The selector also adds an `Options` item after the five views.
- The unused `Partials` view from release notes 1.0.8 is not present in 1.0.22. Release note 1.0.22 says the feature set was changed to avoid patent issues. The shipped app therefore has five modes, not six.

## 4. Resources and visual implementation

- `activity_visualiser.xml` is an empty `LinearLayout`; the renderer surface is added programmatically.
- `activity_options.xml` is a single `ListView`; all option rows are built in code.
- `activity_crashlogs.xml` and `activity_welcome.xml` are empty `RelativeLayout` placeholders.
- Options use the platform dark Holo/legacy dark theme.
- Native drawing supplies the tuner visuals, embedded typography and graphics.
- Custom dialog title style: 20sp white text, centred, black background.
- Option section headers: 14sp bold `#D0D0D0` on `#202020`, with a one-pixel `#404040` divider.
- Option rows: 20sp title, 14sp description, dark background.
- Separators/dialog footers use grey `#606060`/`#808080`; the in-tune threshold and other data are rendered by the native renderer.
- Layouts use `dp`/`sp`, wrap-content rows and weighted action buttons. Buttons are full-width halves/thirds in dialogs.
- No XML theme switch: the UI remains dark in all configurations. The compatibility/diagnostic options are not a light theme.

## 5. Audio pipeline

```
AudioRecord(MIC, sampleRate, MONO, PCM16, minBuffer * multiplier)
        │
        ├─ capture thread reads short[] blocks
        │
        └─ JNI processStreamedSamples(short[], readCount, sampleRate)
                 │
                 ├─ FFT / autocorrelation pitch analysis
                 ├─ note + cents + in-tune state
                 ├─ spectrum / chroma / partial/waveform data
                 ├─ chord estimation
                 └─ native render state
```

Settings that alter audio:

| Setting | Values | Effect |
| --- | --- | --- |
| Sample Rate | 44100, 22050, 11025, 8000 | Capture rate and maximum analysable frequency |
| Analysis Rate | High, Medium, Low | Temporal update rate vs. CPU usage |
| A4 Frequency | 220.0–880.0, 0.1 steps | Reference tuning |
| Display note names | sharp, flat | Spelling of all note labels |
| In-tune threshold | 5, 10, 15 cents | “IN TUNE!” trigger |
| Instrument | 52 presets / 100 custom | Target strings and note indicators |
| Temperament | 17 presets / 100 custom | Per-pitch-class cent offsets |
| Compatibility / audio setup | 1.0.0, 1.0.7, Latest | Capture implementation/buffer strategy |
| Compatibility / audio analysis | 1.0.15, Latest | Analysis implementation |
| Debugging / Audio Input | ON/OFF | Real capture vs. internal diagnostic source |
| Debugging / Visualizations | ON/OFF | Native visualization rendering |
| Debugging / Textures | ON/OFF | Renderer texture paths |

There is no audio recording, playback, metronome, file import/export, cloud sync, account system or network API for tuner functionality. Internet access is for ads/Play services only.

## 6. Persistence

SharedPreferences file: `com.symbolic.pitchlab.settings`.

Keys observed:

```
viewMode, sampleRate, analysisRate, A4ReferenceHz,
instrumentName, temperamentName, texTypeSpectrogram,
noteNameStyle, inTuneThreshold, screenOrientation,
usageMask, audioSetupVersion, audioAnalysisVersion,
customInstrumentCount, customInstrumentInstanceN_Name,
customInstrumentInstanceN_Notes, customInstrumentFocus,
customTemperamentCount, customTemperamentInstanceN_Name,
customTemperamentInstanceN_Cents0..11, customTemperamentFocus,
welcomeShown_1_0_22
```

Defaults: view 0 (Instrument), 44.1 kHz, Medium analysis, A4 440.0, no explicit instrument/temperament (resolves to first presets), RGBA-8888 spectrogram texture (value 5), sharp names, 5-cent threshold, dynamic orientation, usage mask 0, empty audio compatibility strings (→ Latest), one-time help not shown.

Custom instrument names are stored with a leading `!` in this build to mark them as custom; the UI hides it. Custom objects are sorted by display name.

## 7. Security, privacy and limitations

- The app requests microphone and records continuously for analysis; it does not write audio.
- Legacy `WRITE_EXTERNAL_STORAGE` is used by the crash logger, not by the tuner.
- Original native library is 32-bit ARM only. This prevents direct execution on a standard x86_64 emulator.
- No original artwork or compiled native code is reused by the recreation.
- The original app is discontinued and its Play-store services (ads, licensing) are not part of the functional tuner.
- Patent-sensitive displays from older releases (`Partials`, possible decorative strobe implementations) were removed in the supplied 1.0.22 build. The recreation implements the five shipped modes.

## 8. Reproduction strategy

1. Recreate the five views with a high-performance declarative drawing layer (React Native SVG) driven by genuine analysis data.
2. Replace the opaque JNI DSP with a Kotlin native module: `AudioRecord`, radix-2 FFT, autocorrelation/CMNDF pitch detection, spectrum/chroma extraction, chord templates and smooth event streaming to JS.
3. Persist all preferences with AsyncStorage while preserving original key semantics and value ranges.
4. Recreate the legacy dark options UI as React Native screens and modal dialogs; preserve labels, descriptions, validators, limits and destructive confirmations.
5. Implement gesture navigation, long-press view selector, first-run help, unseen-view hint, startup A4/temperament notice and all configuration effects.
6. Verify on an API 35 emulator/device, with real microphone cases where available, and record results in `FEATURE_PARITY_CHECKLIST.md`.
