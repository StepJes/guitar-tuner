# PitchLab Lite — Screen & Navigation Inventory

## 1. Navigation graph

```
App launch
  └─ Boot / settings load (splash overlay)
      └─ First launch? ──yes──> Welcome Help dialog
      │                            └─ OK
      └─ no ──────────────────────> Tuner (Main)
                                      ├─ swipe left/right: 5 views (wraparound)
                                      ├─ long press: View Selector sheet
                                      │    ├─ Instrument
                                      │    ├─ Dial & Strobe
                                      │    ├─ Spectrogram
                                      │    ├─ Chords
                                      │    ├─ BigStrobe
                                      │    └─ Options ──> Options list
                                      └─ toolbar Options ──> Options list
Options list (React Navigation native-stack screen)
  ├─ Help & Information ──> Help modal
  ├─ Preset Instrument ──> Instrument preset modal
  ├─ Custom Instrument ──> Custom list modal
  │     ├─ New ──> Instrument editor modal
  │     ├─ Edit ──> Instrument editor modal
  │     ├─ Delete ──> Confirm delete alert
  │     └─ Load ──> apply + return to tuner
  ├─ A4 Frequency ──> A4 modal
  ├─ Preset Temperament ──> Temperament preset modal
  ├─ Custom Temperament ──> Custom list modal
  │     ├─ New / Edit ──> Temperament editor modal
  │     ├─ Delete ──> Confirm delete alert
  │     └─ Load ──> apply + return to tuner
  ├─ Display Settings ──> Display modal
  ├─ Sample Rate ──> Sample-rate modal
  ├─ Analysis Rate ──> Analysis-rate modal
  ├─ Compatibility ──> Compatibility modal
  ├─ Debugging ──> Debugging modal
  └─ Factory Reset ──> Confirm alert
```

React Navigation is used for the two stable destinations (`Tuner`, `Options`). Dialog-style settings use accessible React Native modals over the Options screen, matching the original Android dialog stack and preserving unsaved/OK-cancel semantics.

## 2. Screen descriptions

### S-01 Boot / loading
- **Purpose:** load persisted settings and audio availability before showing the tuner.
- **Visuals:** centred tuning-wave mark, “PITCHLAB”, subtle “digital chromatic tuner”, progress indicator.
- **States:** first launch, returning launch, storage read failure (defaults used), error boundary.
- **Transitions:** fade to tuner; first-run Help appears over the tuner (as in original).

### S-02 Welcome Help
- **Purpose:** one-time quick start and legal/release information.
- **Original:** scrollable AlertDialog titled “PitchLab 1.0.22” with icon, HTML text, OK button; positive button sets `welcomeShown_1_0_22`, then starts visualiser.
- **Recreation:** full-height modal card with app mark, all help sections, email link, release notes, “Start tuning”.
- **Dismiss:** OK/Start button, back button/gesture; either marks the welcome as shown.

### S-03 Tuner shell
- **Purpose:** primary live tuner and navigation container.
- **Layout:**
  - safe-area top bar: PITCHLAB wordmark, active view title, “Select view” checker icon, Options gear.
  - centre: one visualization at a time; full width; black background.
  - bottom overlay: unseen-view hint (first visits), status/permission/audio error banners, instrument + temperament summary.
- **Gestures:** horizontal drag/flick, long press.
- **Feedback:** haptic? Original has none; no haptics, tactile feedback avoided to preserve behaviour. The recreation uses subtle visual press feedback only.
- **Back:** exits app; Options back returns to tuner.

### V-01 Instrument
```
┌ PITCHLAB                     [view] [options] ┐
│ Guitar, Standard        A4 440.0  Equal Tempered│
│                                                 │
│            ╭───────────────╮                    │
│          ╭─┤   radial      ├─╮                  │
│         │  │   strobe      │  │                 │
│         │  │   E2    +0c   │  │                 │
│         │  │   82.4 Hz     │  │                 │
│          ╰─┤  IN TUNE!     ├─╯                  │
│            ╰───────────────╯                    │
│   E2   A2   D3   G3   B3   E4                   │
│   ●    ○    ○    ○    ○    ○                    │
└─────────────────────────────────────────────────┘
```
- Strobe rotates left when flat and right when sharp.
- Target rail ordered low string → high string; highlights nearest target in cents.
- States: listening (dashes), in tune, flat, sharp, debug disabled, permission denied, audio error.

### V-02 Dial & Strobe
- Semicircular dial with −50…+50 cent scale, needle, chromatic note, Hz, status.
- Linear strobe panel below: five/six repeating bright bands; phase moves according to cents; stable at 0.
- In-tune threshold affects glow/lock state.

### V-03 Spectrogram
- Scrolling heatmap, low frequencies bottom, high frequencies top.
- Horizontal octave/note calibration lines with labels selected by note-name style.
- Right-most column is live; older columns fade.
- Current pitch marker overlays the live column.
- Debug textures OFF uses flat monochrome fill.

### V-04 Chords
- Header: detected chord name (e.g. “Dmaj7”), confidence percentage, instruction “Play a chord”.
- 12-column root grid × 6 rows: maj, min, maj7, min7, dom7, dim7.
- Cells use live scores; best cell bright, close alternatives faint; no-signal state dims all.
- Note-name style changes roots to flats.

### V-05 BigStrobe
- Oversized note and octave, giant cents reading.
- Full-width large strobe field, directional labels “TUNE DOWN” / “TUNE UP”.
- High-contrast in-tune state with `IN TUNE!`.

### S-04 Options
- **Header:** “Options” + back.
- **List sections and rows (exact order):**
  1. Support
     - Help & Information — “Show quick-start guide, contact information, software licenses and release notes.”
  2. Instrument
     - Preset Instrument — “Choose from a list of preset instrument tunings.”
     - Custom Instrument — “Create, edit or load your own custom instrument tunings.”
  3. Tuning
     - A4 Frequency (hz) — “Set the A4 tuning reference frequency.”
     - Preset Temperament — “Choose from a list of preset temperaments.”
     - Custom Temperament — “Create, edit or load your own custom temperaments.”
  4. Display
     - Display Settings — “Adjust display related options and settings.”
  5. Input
     - Sample Rate — “Select a valid input sample rate for your device (a higher sample rate should result in improved frequency accuracy at the expense of reduced battery life).”
     - Analysis Rate — “Choose the signal processing analysis rate (a higher analysis rate should result in improved temporal accuracy at the expense of reduced battery life).”
  6. Miscellaneous
     - Compatibility — “Adjust feature usage to enhance application compatibility.”
     - Debugging — “Temporarily disable application functions to diagnose compatibility issues.”
     - Factory Reset — “Reset all settings to factory default values (custom instruments and temperaments will *NOT* be deleted).”
- Each navigable row has chevron and pressed state. Section headers are non-interactive.
- Selected values shown as trailing summary: active instrument/temperament, A4, sample/analysis rate.

### S-05 Help & Information
- Sections: Latest Release, Quick Start, Visualization Modes, Instrument/Temperament Editor, Compatibility, Performance, Bugs & Crashes, Credits, Release Notes.
- Scrollable. Email link `pitchlabapp@gmail.com`. Close button. Includes version.

### S-06 Preset Instrument
- Single-choice list of 52 tunings with note summary (e.g. "E2 A2 D3 G3 B3 E4") and check.
- Immediate selection on row tap; closes and returns to Options, then tuner resumes on back.
- Empty state is impossible (presets built in), but search/filter is not in original and thus not added.

### S-07 Custom Instrument list
- Empty state: “No custom instruments” + New button.
- Rows: display name (without internal `!`) and note list; current item checked.
- Footer: Load / New / Edit / Delete.
- Load/Edit/Delete disabled when list empty or nothing selected; New disabled at 100.
- New/Edit open S-08. Delete opens confirm alert. Load applies and closes list (and Options via back-navigation flow).

### S-08 Instrument editor
- Fields: name text, “2 strings/notes” … “12 strings/notes” selector.
- Rows 1st…12th, each with note selector and octave selector; hidden rows beyond count.
- Defaults: name `<name>`, 2 strings, both A4.
- Buttons: Save / Cancel.
- Validation: name non-empty, not `<name>`, printable ASCII, <=100 items, unique or overwrite confirm; notes 0–8 octaves.
- On save: close editor, return to custom list; active instrument unchanged until Load.

### S-09 A4 Frequency
- Large numeral input with `<<`, `<`, `>`, `>>`, reset, OK, cancel.
- Range 220.0–880.0; small step 0.1, big step 1.0; reset 440.0.
- Invalid text falls back to last valid value.
- On OK, commits and closes; tuner restarts live analysis on return.

### S-10 Preset Temperament
- Single-choice list of 17 presets with current check; immediate selection.
- Equal Tempered (Perfect Octave) is default.

### S-11 Custom Temperament list
- Similar to S-07; shows name and per-note offsets summary.
- Empty state, selection, Load/New/Edit/Delete semantics identical.

### S-12 Temperament editor
- Name, 12 rows (C…B, or sharp/flat names per display setting).
- For each: −1.0, −0.1, +0.1, +1.0; numeric field; clamp −35.0…+35.0; one decimal.
- Reset restores values with which the dialog opened; Cancel discards.
- Save validation/overwrite confirmation; max 100.

### S-13 Display Settings
- Note names: English (sharp) / English (flat).
- In-tune threshold: 5 cents / 10 cents / 15 cents.
- Screen orientation: dynamic / landscape / portrait.
- OK / Cancel; only OK commits.

### S-14 Sample Rate
- 44khz / 22khz / 11khz / 8khz single-choice.
- On selection commits immediately and restarts audio. If native setup fails, S-15 appears.

### S-15 Audio setup failed
- Title “Audio setup failed!”
- Message names attempted rate and advises selecting a supported rate or rebooting.
- OK returns to sample-rate list. Non-cancelable.

### S-16 Analysis Rate
- High / Medium / Low, current checked. Commits immediately and restarts analysis configuration.

### S-17 Compatibility
- Spectrogram: RGBA-5551 / RGBA-8888.
- Audio Setup: 1.0.0 / 1.0.7 / Latest.
- Audio Analysis: 1.0.15 / Latest.
- OK / Cancel; OK restarts audio/analysis.

### S-18 Debugging
- Audio Input: ON/OFF (default ON).
- Visualizations: ON/OFF (default ON).
- Textures: ON/OFF (default ON).
- OK / Cancel; immediate diagnostic effect after OK.

### S-19 Factory reset confirmation
- Title “Factory Reset?”
- Message exactly warns custom instruments/temperaments are not deleted.
- OK resets all non-custom settings and navigates to tuner/Instrument view; Cancel closes.

### S-20 View selector
- Title “PitchLab Views”.
- Single-choice list of five views + Options.
- Current view checked; selecting a view closes and slides tuner to it; Options navigates to S-04.
- Opened by long press on tuner surface; equivalent accessible toolbar button.

### S-21 Permission gate
- Not in original on Android 2.3 (permission granted at install) but required by modern Android.
- States: request permission, denied (retry), permanently denied (open settings), unavailable device.
- Original-equivalent explanation: microphone is required for tuning.

### S-22 Crash recovery
- Replacement for original launcher crash-log flow.
- Displays “PitchLab encountered a problem”, diagnostic log path, restart and copy actions.

## 3. Dialog behavior and focus rules

- Swiping is disabled while a dialog is open.
- Android back closes top-most dialog; unsaved settings are discarded, except sample-rate/analysis-rate selection and preset lists, which commit on tap.
- Text inputs use numeric keyboards for A4/cents and ASCII keyboards for names.
- Destructive confirmation buttons are clear and not the default accidental target; delete requires the selected custom item.
- All buttons expose accessibility labels; disabled actions are announced as disabled.
- The first-run help marks itself seen even if dismissed via back, matching the original dismiss listener.
- Custom list edits never silently change the active tuning; explicit Load is required.
- Rotating while a dialog is open keeps draft values because dialogs own local draft state.
