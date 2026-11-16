# PitchLab Lite — Functional Specification

This document defines observable behaviour, state transitions, validation and the DSP contract for the recreation. It is the implementation reference; no feature is represented by hardcoded or random readings.

## 1. Application state

```ts
type NoteNameStyle = 0 | 1;          // 0 sharp, 1 flat
type AnalysisRate = -1 | 0 | 1;      // Low, Medium, High
type ScreenOrientation = 0 | 1 | 2;  // dynamic, landscape, portrait
type SpectrogramTexture = 4 | 5;     // RGBA-5551, RGBA-8888
type AudioSetupVersion = '1.0.0' | '1.0.7' | 'Latest';
type AudioAnalysisVersion = '1.0.15' | 'Latest';
```

Persisted settings:

```ts
interface Settings {
  viewMode: 0|1|2|3|4;
  sampleRate: 44100|22050|11025|8000;
  analysisRate: -1|0|1;
  a4Reference: number;                  // 220.0..880.0, 0.1 precision
  instrumentName: string;
  temperamentName: string;
  texTypeSpectrogram: 4|5;
  noteNameStyle: 0|1;
  inTuneThreshold: 5|10|15;
  screenOrientation: 0|1|2;
  usageMask: number;                    // bits 0..4 for visited views
  audioSetupVersion: '1.0.0'|'1.0.7'|'Latest';
  audioAnalysisVersion: '1.0.15'|'Latest';
  debugMask: number;                    // bit0 audio, bit1 visualisations, bit2 textures
  welcomeShown: boolean;
  customInstruments: CustomInstrument[];
  customTemperaments: CustomTemperament[];
}
```

Defaults: `viewMode=0`, `44100`, Medium `0`, `440.0`, first preset instrument, first preset temperament, RGBA-8888 `5`, sharp `0`, threshold `5`, dynamic `0`, `usageMask=0`, Latest/Latest, debug `0`, welcome false, empty customs.

Invalid persisted values are repaired on load (range, enum, missing custom definitions). Storage failure falls back to defaults and surfaces a non-blocking warning.

## 2. Audio lifecycle

1. Main tuner mounts/focuses.
2. If debug audio bit is set OFF: do not request microphone; show diagnostic-disabled state.
3. Else check `RECORD_AUDIO`; if not granted show permission gate and request on user action.
4. Start native engine with the full configuration.
5. Native creates `AudioRecord(MIC, sampleRate, MONO, PCM16, bufferSize)`.
6. Capture thread reads PCM blocks and appends to a ring buffer.
7. At each analysis hop, DSP computes a reading and emits it to JS.
8. On navigation to Options, background, or unmount: stop capture, release `AudioRecord`, cancel thread, clear status.
9. On return/foreground: restart with current settings.
10. On sample/analysis/compat/audio changes while active: stop, re-create engine, start; if creation fails show audio error with attempted rate.

Engine status states: `idle`, `requesting`, `starting`, `running`, `disabled`, `no_permission`, `error`, `stopped`.

### Start failure
- `getMinBufferSize <= 0`, `AudioRecord` initialisation failure, `startRecording` failure, or security exception → status `error`.
- Error payload includes attempted sample rate, code/message, and recoverable flag.
- Main displays “Audio setup failed!”. The error dialog offers “Change sample rate” and dismiss/retry.
- The app never substitutes random data after an error.

### Runtime failure/interruption
- Read returns negative/zero repeatedly → emit degraded status; after 1.5 s of failed reads stop and emit error.
- Capture resumes only on explicit retry or lifecycle restart.
- Other apps taking the mic may cause reads to stop; on foreground resume restart.

## 3. Audio analysis contract

### Capture
- Mono, 16-bit signed PCM, native byte order.
- Supported rates exactly: 44100, 22050, 11025, 8000.
- Setup compatibility multiplier:
  - `1.0.0`: 1× minimum buffer, read half-window blocks (legacy small-buffer path).
  - `1.0.7`: 2× minimum buffer.
  - `Latest`: 4× minimum buffer.
- Analysis window: next power of two ≥ 0.18 s, clamped 2048–8192.
  - 44.1 kHz → 8192, 22.05 kHz → 4096, 11.025/8 kHz → 2048.
- Hop sizes (High/Medium/Low): 2048/4096/8192 samples at 44.1 kHz, scaled by rate with a minimum of 256.

### Pitch (Latest)
- Remove DC, apply Hann window.
- Compute autocorrelation via FFT.
- Compute CMNDF:
  `d(τ) = Σ_{j=0}^{N-τ-1}(x[j]-x[j+τ])²`
  `cmndf(τ) = d(τ) / ((1/τ)Σ_{k=1}^{τ}d(k))`
- Search lags for 5000 Hz down to 25 Hz (or N/2).
- Select the first local minimum below 0.15; otherwise the global minimum.
- Parabolic interpolation around the chosen lag.
- `frequency = sampleRate / lag`, clamp to Nyquist × 0.95.
- `confidence = 1 - cmndf(best)`, clamped 0..1.
- Reject readings with RMS below noise floor (`0.0015`) or confidence below 0.25; UI shows listening.

### Pitch (Audio Analysis 1.0.15 compatibility)
- FFT peak interpolation over the strongest non-DC bin in 60–1500 Hz.
- Confidence from peak prominence and harmonic support.
- Softer octave disambiguation: prefer the lower fundamental when a strong sub-harmonic is present.
- Used only when compatibility selects 1.0.15; still real microphone data.

### Note mapping
- `midiFloat = 69 + 12 * log2(freq / a4Reference)`.
- Nearest integer MIDI `m`.
- Temperament offset in cents `t = temperamentCents[m mod 12]`.
- Target frequency `fTarget = a4Reference * 2^((m-69)/12) * 2^(t/1200)`.
- `cents = 1200 * log2(freq / fTarget)`, clamp display to ±50 but preserve internal value.
- Re-evaluate neighbours `m-1, m, m+1` and select the target with the smallest absolute cents.
- Status: `abs(cents) <= threshold` → IN TUNE!; negative → TUNE UP (flat); positive → TUNE DOWN (sharp).
- Note names from MIDI: sharps `C C# D D# E F F# G G# A A# B`; flats `C Db D Eb E F Gb G Ab A Bb B`.
- Octave convention: MIDI 60 = C4 (A4=69).

### Instrument target matching
- Instrument notes are MIDI integers, low string → high string as entered in preset data.
- Convert each to a target frequency using A4 + temperament.
- For every reading, find target with smallest absolute cents difference.
- Emit `stringIndex` and `stringCents` for the Instrument rail. When no instrument fits within ±200 cents, still show chromatic note but no string highlight.

### Spectrum
- FFT size = next power of two ≥ window; magnitude linear.
- 96 log-spaced bands from 30 Hz to `min(6000, nyquist*0.98)`.
- Each band max magnitude; convert to dB (`20log10`), normalize −80…0 dB to 0..1 with square-root perceptual scaling.
- One-pole smoothing: attack 0.6, release 0.22 per frame; no random values.
- Emit normalized bands. Silence produces near-zero bands.

### Chroma and chords
- Use spectral local maxima from ~55 Hz to 4000 Hz; minimum relative magnitude 0.006.
- Parabolic peak interpolation; map frequency to MIDI pitch class.
- Accumulate `sqrt(magnitude)` with a mild low-frequency emphasis, then normalize; subtract a fraction of the median to suppress broadband noise.
- Score 72 chord candidates: 12 roots × {maj [0,4,7], min [0,3,7], maj7 [0,4,7,11], min7 [0,3,7,10], dom7 [0,4,7,10], dim7 [0,3,6,9]}.
- Cell score `= rootWeight*chroma[root] + chordToneSum - 0.35*nonChordToneSum`; normalize across candidates.
- Detected chord = top candidate. Confidence = clamp(top - second, 0..1) blended with absolute top score.
- UI considers confidence < 0.22 “no clear chord”; no fabricated result.
- Reading includes `chordRoot`, `chordQuality`, `chordName`, `chordConfidence`, `chordScores[12][6]`.

### Waveform
- 128 normalized samples from the analysis window, peak-normalized. Used for diagnostic/embedded display only; no fake animation.

### Event cadence
- Emit reading after each hop; expected 20–22 Hz at High/44.1 kHz, ~11 Hz Medium, ~5 Hz Low.
- Event payload must include timestamp and configuration revision so stale readings can be discarded after settings changes.

## 4. View behaviour

### View switching
- `viewMode` wraps modulo 5.
- Swipe threshold: horizontal dx > 48 dp and > vertical dy, or velocity > 450 dp/s.
- Left swipe → next view; right swipe → previous; both wrap.
- Tapping does not change view; tapping dismisses the transient hint.
- Long press (≥450 ms) with little movement opens the view selector.
- Swiping during a dialog is disabled.
- Each visited view sets its usage bit. `usageMask` persists.
- If unseen bits remain, show hint:
  - text: `SWIPE SCREEN LEFT/RIGHT`
  - second line: `(N REMAINING)`
- Hint is removed when all five bits set or after user taps it.

### View selector
- Items exactly: Instrument, Dial & Strobe, Spectrogram, Chords, BigStrobe, Options.
- Selecting a view sets index and closes; selecting Options navigates without changing view.
- Current view is checked; generator does not auto-advance.

### Animation
- On measurement, note/cents/frequency transitions use short interpolation to avoid jitter but never invent values.
- Strobe motion uses measured cents and wall-clock time; it stops within in-tune threshold (visual lock) and drifts left/right outside it.
- Note changes snap immediately (no crossfade of unrelated notes), while optional 120 ms fade for text.

## 5. Options functionality

### Help & Information
- Opens scrollable help containing original text semantics and release notes.
- Email link opens mail composer; if none available, copy address and show confirmation.
- Dismiss = mark welcome shown only for first-run dialog. Regular help does not change state.

### Preset instrument
- List 52 entries sorted by their original names.
- Row shows name and space-separated note summary.
- Tapping saves `instrumentName` immediately, closes, and triggers audio parameter update on return.
- Invalid/missing persisted name resolves to first preset.
- Built-in names cannot be edited/deleted.

### Preset temperament
- List 17 presets; tapping saves `temperamentName`, closes.
- Missing name resolves to Equal Tempered (Perfect Octave).

### Custom instruments
- List sorted case-sensitively by display name.
- Each row shows name and note summary. 2–12 notes.
- Operations:
  - **Load**: require selection; set active instrument name to `!name`; close list. Tuner resumes.
  - **New**: disabled at 100; opens editor with `<name>`, 2 strings, A4/A4, no existing index.
  - **Edit**: require selection; opens editor preloaded.
  - **Delete**: require selection; confirm with `Delete custom instrument '<name>'? This operation cannot be undone.`; remove; if active, fall back to Guitar, Standard.
- Max 100; sorted after save.
- Name filter accepts printable ASCII only; internal leading `!` is hidden from users.
- Save flow:
  - Trim name; reject empty, `<name>`, duplicate-with-confirm if not editing same item.
  - Collect visible rows; 2–12.
  - User-facing row 1 is the highest string. Store notes low→high by reversing rows.
  - Closure: save, return to custom list with new item selected.
  - Overwrite prompt text: `Overwrite custom instrument '<name>'? This operation cannot be undone.`
- Cancel discards draft and closes editor, returning to list.

### Custom temperaments
- Same list semantics, 100 cap.
- Row summary shows 12 signed one-decimal offsets.
- Editor:
  - Name; 12 rows C…B.
  - Initial values equal current definition or zeros for new.
  - Each row clamps to [−35.0, +35.0]; step 0.1/1.0; display one decimal (including `0.0`).
  - Reset restores opening values (not zero when editing).
  - Save validates name, duplicate/overwrite confirm, rounds to 0.1, returns to list.
  - Delete confirmation: `Delete custom temperament '<name>'? This operation cannot be undone.`
- Loading applies offsets immediately to tuner analysis.

### A4 Frequency
- Value is clamped to 220.0–880.0; default/reset 440.0.
- Buttons: `<<` −1.0, `<` −0.1, `>` +0.1, `>>` +1.0.
- Text input accepts decimal; parse failure restores last valid; out-of-range clamps.
- OK commits; Cancel discards; Reset changes draft only until OK.
- Non-default A4 is announced on the tuner when returning from Options.

### Display Settings
- Note names: English (sharp), English (flat). Affects reading, string rail, temperament editor labels, chord grid roots, spectrogram labels.
- In-tune threshold: 5, 10, 15 cents. Affects status, colours, strobe lock.
- Screen orientation: dynamic/landscape/portrait. Dynamic = sensor; landscape/portrait lock at Activity level. Changing while in Options applies after OK and rotates the Activity; modal draft persists.
- OK commits all; Cancel discards all.

### Sample Rate
- Options displayed: `44khz`, `22khz`, `11khz`, `8khz` (integer division of rates).
- Current rate checked. Tapping immediately persists and restarts audio.
- If restart fails, show audio setup error dialog with attempted rate. Preserve the failed selected rate? Original selected then failure; the recreation reverts to last working rate after dismissal to keep the tuner usable, while documenting the attempted rate in the error.
- Higher rate improves high-frequency accuracy and low-bass ability; 8 kHz cannot analyse bass fundamentals.

### Analysis Rate
- High, Medium, Low; current checked; immediate persistence/restart.
- High gives fastest visual response and highest CPU; Low gives slowest.

### Compatibility
- Spectrogram: RGBA-5551 (5-bit quantization) or RGBA-8888 (full).
- Audio Setup: 1.0.0 (small legacy buffer), 1.0.7 (2× buffer), Latest (4× buffer).
- Audio Analysis: 1.0.15 (legacy peak detector), Latest (CMNDF autocorrelation).
- OK commits and restarts engine; Cancel discards. Values persist.

### Debugging
- Audio Input ON/OFF. OFF stops capture, shows explicit disabled diagnostic state; no simulated readings.
- Visualizations ON/OFF. OFF stops drawing the live view and shows a safe diagnostic placeholder; analysis may continue for diagnostics.
- Textures ON/OFF. OFF disables heatmap texture/smoothing and uses flat monochrome cells.
- Debug flags persist and are included in engine config; OK commits, Cancel discards.

### Factory reset
- Confirmation exactly explains customs are retained.
- OK restores defaults except custom arrays; clears usage/welcome flag; stops audio; navigates to main (Instrument view). Cancel does nothing.
- Custom instruments/temperaments remain, matching original.

## 6. Persistence and restoration

- Save after every committed change; debounced to avoid excessive writes.
- `usageMask` updated when a view first becomes active and on startup for current view.
- View index restored; out-of-range repaired.
- Active instrument/temperament names resolved against presets then customs; missing → default.
- Custom arrays validated: max 100, 2–12 instrument notes, 12 temperament offsets, finite values, clamp cents.
- Wipe on storage corruption with a visible warning; do not crash.
- Factory reset writes defaults immediately.
- First-run welcome marks itself shown when dismissed from any path.

## 7. Accessibility behaviour

- Live tuner values exposed via `accessibilityLiveRegion="polite"` only when note or tune state changes, throttled to 1.5 s.
- View selector announces “View N of 5”.
- All Switches/steppers have labels and current values.
- Delete confirmations state the item name.
- Color-coded statuses include text and arrows.
- Reduce Motion: no sliding view transition or continuous strobe drift; static directional pattern and text remain.

## 8. Out-of-scope / documented limitations

- No audio file input/output, metronome, recording, cloud sync or accounts; none exists in the APK.
- Ads and Google services are intentionally omitted.
- Original proprietary OpenGL assets are not reused; visuals are independently recreated.
- ARM-only original cannot execute on the available x86_64 emulator, so pixel-perfect screenshots of the original renderer could not be captured. Geometry was reconstructed from native strings/help/layout descriptions.
