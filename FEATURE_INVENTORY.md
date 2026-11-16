# PitchLab Lite — Feature Inventory

Legend: **P** = present in analysed APK, **R** = recreated, **N/A** = external service/omitted with rationale.

## 1. Startup and lifecycle

| ID | Feature | Original behaviour | Recreation |
| --- | --- | --- | --- |
| F-01 | P | Launcher bootstrap | `ActivityCrashlogs` starts the process, initialises native state and immediately opens the welcome/main flow. | `App` boot screen loads persisted settings, installs an error boundary and renders the main stack. **R** |
| F-02 | P | First-run help | `ActivityWelcome` shows a scrollable “PitchLab 1.0.22” help dialog with release notes, credits, tests and email link; closing opens the tuner. Shown until `welcomeShown_1_0_22` is set. | First-run Help modal with identical sections/text, persisted flag. **R** |
| F-03 | P | Crash log capture | Breakpad/crash-log activity writes to external storage and relaunches. | React error boundary writes a timestamped diagnostic to app storage and offers a restart. **R** |
| F-04 | P | Keep screen awake | WakeLock held while visualiser is active. | Main screen calls native `setKeepScreenOn(true)` while focused. **R** |
| F-05 | P | Startup A4 notice | Toast if A4 ≠ 440. | Transient banner on main screen. **R** |
| F-06 | P | Startup temperament notice | Toast for custom/preset non-default temperament. | Transient banner on main screen. **R** |
| F-07 | P | Audio auto start/stop | Starts capture in `onResume`; stops in `onPause`; native pause callback in `onStop`. | Focus/AppState driven start/stop with cleanup. **R** |
| F-08 | P | Orientation control | Dynamic/landscape/portrait via requested orientation. | Native module sets requested orientation; UI is responsive. **R** |
| F-09 | N/A | AdMob banner | Free-build banner on capable devices. | Not recreated; external ad service and not part of tuning functionality. Documented limitation. |
| F-10 | N/A | Play services / licensing / crash back end | Google services. | Not recreated; no dependency. |

## 2. Main tuner and navigation

| ID | Feature | Original behaviour | Recreation |
| --- | --- | --- | --- |
| F-11 | P | Five visualization modes | Instrument, Dial & Strobe, Spectrogram, Chords, BigStrobe. | All five implemented with live data. **R** |
| F-12 | P | Horizontal swipe navigation | Fling left/right cycles views; renderer shows slide offset animation. | PanResponder + Animated offset/opacity; wraps around. **R** |
| F-13 | P | Long-press view selector | “PitchLab Views” single-choice dialog with five views + Options. | Long-press opens modal selector, current view checked. **R** |
| F-14 | P | Hardware Menu | Menu key opens Options. | Header options button; hardware menu support where present via native key event? The recreation uses an accessible on-screen control. **R** (platform-equivalent) |
| F-15 | P | View persistence | Last view saved and restored. | Persisted `viewMode`. **R** |
| F-16 | P | Unseen-view hint | “SWIPE SCREEN LEFT/RIGHT” plus `(%d REMAINING)` until every view has been visited; usage mask persisted. | Animated hint with remaining count; usage bitmask persisted. **R** |
| F-17 | P | Animated view swiping | Native frame offset while dragging. | Native-driver `Animated` translation + fading. **R** |
| F-18 | P | Single tap | Renderer exposes `clickFrame`, but the shipped Java layer does not bind a single-tap action. | No hidden action; tap only dismisses transient hint, preserving observed behaviour. |
| F-19 | P | Audio error overlay | Native “Audio Error!” panel instructs selecting a valid sample rate/reboot. | Error overlay + sample-rate shortcut and diagnostic text. **R** |
| F-20 | P | Debug visualisation mask | Disables audio, visualizations or textures for diagnosis. | All three switches affect live processing/rendering. **R** |

## 3. Instrument view

| ID | Feature | Original behaviour | Recreation |
| --- | --- | --- | --- |
| F-21 | P | Radial strobe | Concentric/rotating strobe feedback around the note display; left = flat, right = sharp. | Genuine time-based rotating radial strobe driven by cents offset. **R** |
| F-22 | P | Note/octave readout | Large analysed note and octave. | Same, sharp/flat aware. **R** |
| F-23 | P | Cents/frequency readout | Cents deviation and Hz. | Same with one-decimal Hz and signed cents. **R** |
| F-24 | P | In-tune state | “IN TUNE!”, “TUNE UP”, “TUNE DOWN” with threshold. | Same labels, colour and threshold. **R** |
| F-25 | P | String/note indicators | Displays current instrument’s target notes and highlights the closest string. | Pill/string rail with nearest target and per-string state. **R** |
| F-26 | P | Instrument name context | Uses selected preset/custom tuning. | Displays selected instrument; edit shortcut in options. **R** |

## 4. Dial & Strobe view

| ID | Feature | Original behaviour | Recreation |
| --- | --- | --- | --- |
| F-27 | P | Analogue-style dial | Needle indicates cents deviation from true pitch. | Semicircular dial, major/minor ticks, needle with clamping and smoothing. **R** |
| F-28 | P | Linear strobe | Genuine repeating strobe bars drift left when flat/right when sharp. | Animated bar field with phase derived from cents and elapsed time. **R** |
| F-29 | P | Note + frequency + status | Chromatic note, octave, Hz, in-tune guidance. | Same. **R** |

## 5. Spectrogram view

| ID | Feature | Original behaviour | Recreation |
| --- | --- | --- | --- |
| F-30 | P | Scrolling spectrum | Live frequency content drawn as a scrolling heatmap. | 96 log-frequency bands, 72-column history, colour-mapped. **R** |
| F-31 | P | Note calibration markers | Horizontal note lines/labels aligned with pitch. | Log-frequency grid with octave/note labels. **R** |
| F-32 | P | Voice/instrument visualisation | Wide-range analysis including voice. | Spectrum 30 Hz–6 kHz (rate-limited by Nyquist). **R** |
| F-33 | P | Texture compatibility | RGBA-5551/RGBA-8888 affects renderer. | Preset quantises the heatmap/intensity; 8888 uses full precision. **R** |

## 6. Chords view

| ID | Feature | Original behaviour | Recreation |
| --- | --- | --- | --- |
| F-34 | P | Chord grid | Grid of roots × six qualities: maj, min, maj7, min7, dom7, dim7. | 12 × 6 grid with live scores/highlight. **R** |
| F-35 | P | Polyphonic estimation | Estimates likely chord from simultaneous notes. | Native chromatic peak analysis + chord templates, confidence gating. **R** |
| F-36 | P | Current chord summary | User can read likely chord from grid. | Large chord name + confidence meter. **R** |
| F-37 | P | No-signal state | Grid remains but no reading. | “Play a chord” empty state. **R** |

## 7. BigStrobe view

| ID | Feature | Original behaviour | Recreation |
| --- | --- | --- | --- |
| F-38 | P | Large single strobe | Optimised for small screens; oversized note/strobe feedback. | Large note, giant cents scale, full-width bar field and directional guidance. **R** |
| F-39 | P | Threshold feedback | In-tune emphasis. | Colour/glow + “IN TUNE!” state. **R** |

## 8. Options — support

| ID | Feature | Original behaviour | Recreation |
| --- | --- | --- | --- |
| F-40 | P | Help & Information | One dialog containing quick start, mode descriptions, editor usage, compatibility, performance, bugs, credits, email, release notes. | Scrollable Help screen with identical content, links and release notes. **R** |
| F-41 | P | Support email | `pitchlabapp@gmail.com` mail link. | Tappable mail link. **R** |
| F-42 | P | Release notes | 1.0.0 through 1.0.22. | Full list. **R** |
| F-43 | P | Credits | Bitmap artist, Breakpad. | Reproduced as attribution text. **R** |
| F-44 | P | About/version title | “PitchLab 1.0.22” with icon. | About dialog shows “PitchLab Lite 1.0.22 (recreation)”. **R** |

## 9. Options — instrument

| ID | Feature | Original behaviour | Recreation |
| --- | --- | --- | --- |
| F-45 | P | 52 preset instrument tunings | Guitar, bass, violin, viola, fiddle, mandolin, ukulele, banjo, bouzouki, pedal steel. | Complete factual preset list. **R** |
| F-46 | P | Preset selection | Single-choice list, current item checked; selection saves `instrumentName`. | Modal list with check and immediate save. **R** |
| F-47 | P | Custom instrument list | Up to 100; Load/New/Edit/Delete; current checked; new disabled at 100. | Same, with error/selection handling. **R** |
| F-48 | P | Custom instrument editor | Name, 2–12 strings/notes, note + octave spinners, Save/Cancel; 1st is highest string; save re-sorts list. | Same limits, note/octave pickers, validation. **R** |
| F-49 | P | New instrument | Default name `<name>` and 2 strings. | Same placeholder, empty treated as invalid on save. **R** |
| F-50 | P | Edit instrument | Loads selected custom into editor. | Same. **R** |
| F-51 | P | Delete instrument | Confirmation with name; cannot undo. | Same. **R** |
| F-52 | P | Duplicate name overwrite | Save detects existing name and asks “Overwrite Instrument?”. | Same confirmation. **R** |
| F-53 | P | ASCII name filter | Only printable ASCII accepted. | Validation + input filter. **R** |
| F-54 | P | Load custom instrument | Sets current tuning and closes list. | Same; app closes options and restarts analysis with new target notes. **R** |
| F-55 | P | Use custom tuning in visualization | String indicators update to custom notes. | Native nearest-string mapping and UI rail. **R** |

## 10. Options — tuning

| ID | Feature | Original behaviour | Recreation |
| --- | --- | --- | --- |
| F-56 | P | A4 reference | 220.0–880.0 Hz, ±0.1/±1 buttons, editable numeric, reset 440.0, OK/Cancel. | Same range/step/clamp/reset/validation. **R** |
| F-57 | P | 17 preset temperaments | Equal tempered variants, Kirnberger I/IIa/IIb/III, Meantone variants, Pythagorean variants, Valotti, Young I/II. | Complete factual preset list. **R** |
| F-58 | P | Temperament selection | Single-choice list with current check. | Same. **R** |
| F-59 | P | Custom temperament list | Up to 100; Load/New/Edit/Delete; new disabled at 100. | Same. **R** |
| F-60 | P | Temperament editor | Name + 12 pitch-class offsets, −35.0…+35.0 cents, ±0.1/±1.0, Save/Reset/Cancel. | Same, with validation and reset-to-open-values. **R** |
| F-61 | P | Note labels in temperament editor | Follows sharp/flat display setting. | Same. **R** |
| F-62 | P | Temperament affects tuner | Cents offsets applied to target pitches. | Applied by native DSP and note rail. **R** |
| F-63 | P | Duplicate temperament overwrite | Confirmation. | Same. **R** |
| F-64 | P | Delete temperament | Confirmation with name; cannot undo. | Same. **R** |
| F-65 | P | Custom temperament load | Sets active temperament and resumes tuner. | Same. **R** |

## 11. Options — display

| ID | Feature | Original behaviour | Recreation |
| --- | --- | --- | --- |
| F-66 | P | Note name style | English sharp or flat. | Affects all note labels, editors, chord names. **R** |
| F-67 | P | In-tune threshold | 5/10/15 cents. | Affects status, colours and strobe “lock”. **R** |
| F-68 | P | Screen orientation | dynamic/landscape/portrait. | Native requested orientation; responsive layouts. **R** |
| F-69 | P | OK/Cancel semantics | Spinners only commit on OK. | Draft state in dialogs; cancel discards. **R** |

## 12. Options — input

| ID | Feature | Original behaviour | Recreation |
| --- | --- | --- | --- |
| F-70 | P | Sample rate list | 44 kHz, 22 kHz, 11 kHz, 8 kHz; current checked; selection restarts audio. | Same. Native restart and error reporting. **R** |
| F-71 | P | Audio setup failure | Dialog with exact attempted rate and advice to choose supported rate/reboot. | Modal error with same advice and action to change rate. **R** |
| F-72 | P | Analysis rate | High/Medium/Low; CPU vs temporal resolution. | High ≈45 ms, Medium ≈90 ms, Low ≈180 ms update hops. **R** |

## 13. Options — miscellaneous

| ID | Feature | Original behaviour | Recreation |
| --- | --- | --- | --- |
| F-73 | P | Compatibility — spectrogram texture | RGBA-5551 or RGBA-8888. | 5551 quantisation vs full RGB output. **R** |
| F-74 | P | Compatibility — audio setup | 1.0.0, 1.0.7, Latest. | Changes capture buffer multiplier / legacy capture strategy. **R** |
| F-75 | P | Compatibility — audio analysis | 1.0.15, Latest. | Selects legacy spectral peak detector vs current autocorrelation detector. **R** |
| F-76 | P | Debugging — audio input | ON/OFF; OFF uses internal diagnostic source in original. | OFF stops capture and shows a clear “Audio input disabled” diagnostic state (no fake tuner readings). **R** (safer equivalent) |
| F-77 | P | Debugging — visualizations | ON/OFF. | OFF suspends visualization drawing and shows state. **R** |
| F-78 | P | Debugging — textures | ON/OFF. | OFF uses flat simplified rendering/heatmap. **R** |
| F-79 | P | Debugging usage mask | Persisted. | Persisted bitmask. **R** |
| F-80 | P | Factory reset | Confirmation; resets settings but keeps custom instruments/temperaments. | Same; also restores default view/orientation. **R** |
| F-81 | P | Delete focus indices | Persist selected custom item. | Selection state retained while list open. **R** |

## 14. Data / validation / edge cases

| ID | Feature | Original behaviour | Recreation |
| --- | --- | --- | --- |
| F-82 | P | Custom definition cap | 100 instruments; 100 temperaments. | Enforced in UI and store. **R** |
| F-83 | P | String count range | 2–12. | Enforced. **R** |
| F-84 | P | Temperament offset range | −35.0…+35.0, 0.1 precision. | Enforced and rounded to one decimal. **R** |
| F-85 | P | Note octave range | 0–7 in editor; A4 allowed. | 0–8 offered, clamped to valid audible range; analyzed notes 0–9. **R** |
| F-86 | P | Empty custom lists | Load/Edit/Delete disabled except New. | Same, with accessible disabled reasons. **R** |
| F-87 | P | Duplicate names | Overwrite confirmation. | Case-sensitive collision check, confirmation. **R** |
| F-88 | P | Invalid numeric input | Falls back to previous value / clamps. | Numeric keyboard, parse fallback, clamp. **R** |
| F-89 | P | Microphone denial | System permission request; app cannot analyse. | Permission panel, retry and open-settings actions. **R** |
| F-90 | P | Sample-rate unsupported | Shows Audio setup failed and returns to rate selection. | Native rejects with rate detail, UI offers change. **R** |
| F-91 | P | Audio interruption / unplug / background | Stops/restarts on lifecycle; diagnostics. | Stops on background, restarts on foreground; read errors shown; manual retry. **R** |
| F-92 | P | Weak/ambiguous signal | Strobe/dial may be unstable; no fabricated reading. | Confidence gating and “Listening…” state; no random data. **R** |
| F-93 | P | Very low/high notes | Limited by sample rate; bass tunings need 44.1k. | Frequency/Nyquist limits surfaced; low-note detection tuned for 30 Hz. **R** |
| F-94 | P | High ambient noise | Confidence/spectrum reflect noise. | Noise gating, confidence threshold, retry state. **R** |

## 15. Omitted external / non-tuner items

| ID | Feature | Reason |
| --- | --- | --- |
| X-01 | AdMob banner | External monetisation; no functional tuning value; no SDK included. |
| X-02 | Play Services version check | Legacy dependency; not needed. |
| X-03 | Native Breakpad uploader | Crash logs are local only in the recreation; no external upload. |
| X-04 | Google Play PRO promotion | Obsolete store link/dead product; documented in help only. |
| X-05 | Original bitmaps/fonts/native `.so` | Proprietary assets intentionally not reused. |
