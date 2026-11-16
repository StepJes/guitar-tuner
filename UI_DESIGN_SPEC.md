# PitchLab Lite — UI Design Specification

## 1. Design intent

The original is a legacy Android Holo-era, landscape-friendly instrument panel: near-black background, high-contrast numeric readout, saturated strobe colours and a simple settings list. The recreation preserves that visual language while replacing the obsolete OpenGL renderer with responsive React Native drawing primitives.

Principles:
1. **Tuning first.** The note and deviation are always the largest, highest-contrast elements.
2. **Instrument-panel aesthetic.** Dark metal/plastic surfaces, thin grid lines, condensed numerals and luminous accents.
3. **Unmistakable direction.** Flat and sharp states are encoded by colour, text and motion, never colour alone.
4. **Quiet chrome.** Navigation and status controls recede; the live visualization owns the screen.
5. **No decorative fake motion.** Strobe motion is always derived from measured cents deviation.

## 2. Colour tokens

| Token | Hex | Use |
| --- | --- | --- |
| `bg` | `#05090B` | Window/visualizer background |
| `bgElevated` | `#0B1215` | Cards, sheets |
| `surface` | `#111B1F` | Rows, panels |
| `surfaceAlt` | `#17252A` | Raised controls, grid headers |
| `border` | `#26383D` | Dividers, inactive ticks |
| `grid` | `#1A2B30` | Spectrogram/grid lines |
| `text` | `#ECF7F3` | Primary text |
| `textSecondary` | `#9CB2AD` | Descriptions |
| `textMuted` | `#657A76` | Disabled/supporting |
| `accent` | `#55E3B6` | Primary action, in tune, active state |
| `accentDim` | `#1E7A63` | In-tune glow, secondary fills |
| `flat` | `#4FA9FF` | Flat indication / “TUNE UP” |
| `sharp` | `#FF8A5B` | Sharp indication / “TUNE DOWN” |
| `warning` | `#FFC857` | Diagnostics, unseen hint |
| `danger` | `#FF6464` | Delete/audio error |
| `titleBar` | `#020506` | Native-style title bar |
| `dialogScrim` | `rgba(0,0,0,0.72)` | Modal backdrop |
| `dialogSurface` | `#0D1518` | Modal body |
| `dialogHeader` | `#020506` | Modal title bar |

The original uses legacy black/white/grey dialogs plus native-rendered saturated displays. The recreation keeps dialogs black/grey and applies the accent only to selection/action states.

Spectrogram ramp (low → high intensity):
`#061015 → #083344 → #0A6863 → #17A57E → #A4E54B → #FFE66D → #FF8A5B`
RGBA-5551 compatibility quantises each channel to 5 bits before applying the ramp, producing visible banding as the original texture mode did.

## 3. Typography

Use platform system fonts to avoid copying the embedded proprietary font.

| Role | Family | Size | Weight | Notes |
| --- | --- | --- | --- | --- |
| Wordmark | `sans-serif-condensed` | 18–22 sp | 700 | letterSpacing 3, uppercase |
| View title | `sans-serif-condensed` | 14 sp | 600 | uppercase, textSecondary |
| Giant note | `sans-serif-condensed` | 108–180 sp responsive | 700 | tabular numerals, tight line height |
| Note (display) | `sans-serif-condensed` | 54–80 sp | 700 | 44–64 sp in compact layouts |
| Frequency | `monospace` | 18–24 sp | 500 | one decimal + “Hz” |
| Cents | `monospace` | 24–44 sp | 600 | signed |
| Status | `sans-serif-condensed` | 26–36 sp | 700 | uppercase |
| Section header | `sans-serif` | 14 sp | 700 | uppercase, tracking 1.2 |
| Option title | `sans-serif` | 18–20 sp | 500 | as original 20sp |
| Option description | `sans-serif` | 13–14 sp | 400 | 2–4 lines |
| Dialog title | `sans-serif-condensed` | 20 sp | 600 | centred, white |
| Button | `sans-serif` | 15–16 sp | 600 | uppercase optional |
| Small data | `monospace` | 11–12 sp | 400 | labels, grid values |

On tablets/landscape, cap reading type sizes so the note never clips; use `useWindowDimensions` with clamp:
`giant = clamp(88, min(width * 0.22, height * 0.38), 180)`.

## 4. Spacing, radii and elevation

- Base spacing unit: 4 dp. Scale: 4, 8, 12, 16, 20, 24, 32, 40.
- Screen horizontal padding: 16 dp (phone), 24–32 dp (tablet).
- Visualizer internal padding: 12–20 dp; concentric dial radius based on `min(width, height) * 0.36`.
- Options row padding: 12 left/right, 10 top/bottom; section header padding 6 left/right, 8 top/bottom.
- Card radius: 12 dp; dialog radius: 8 dp (legacy rounded corners); pill radius: 999.
- Buttons: 44 dp minimum height; dialog buttons 48 dp; 1 dp border; radius 6 dp.
- Elevation is minimal: 1 dp borders and a subtle `#000` shadow on floating dialogs.
- Dividers: 1 dp `border`; section header divider in original style.
- Touch targets >= 44×44 dp, with 8 dp separation.

## 5. Screen layout rules

### Tuner
- Safe area top/bottom respected. In landscape, top bar height 48 dp; in portrait 56 dp.
- Visualization fills remaining space.
- Instrument/temperament summary is a single line under the top bar (ellipsized), not a second toolbar.
- Status banners float above the home indicator without covering the note centre.
- Unseen hint sits at bottom centre and disappears when all five views have been visited; it can also be dismissed with a tap.
- The selected view is not shown as a bottom tab bar; navigation is gesture/menu-based as in the original.

### Options
- Full-screen scroll list on phone; max content width 760 dp and centred on tablets.
- Section header: uppercase, background `surfaceAlt`, sticky-ish visual block; not interactive.
- Rows: title + optional description + trailing value/chevron; pressed background `surfaceAlt`.
- Values: instrument name, temperament, “440.0 Hz”, “44.1 kHz”, “Medium”, etc.
- Destructive Factory Reset row uses danger text only for the action label, not the whole row.

### Dialogs
- Presentation: transparent full-screen overlay with 24 dp margins (phone), centred card max 560 dp.
- Header: black title bar, 20 sp centred white text, optional close icon.
- Body: scrollable with 16 dp padding.
- Footer: 1 px divider, grey/black background, buttons in a row, equal weight.
- Lists fill the dialog; selected row shows a right-side check and accent text.
- Full editors (instrument/temperament) may use 92–96% screen height to fit 12 rows.

## 6. Component specifications

### Primary button
- Background accent; text `#03100C`; radius 6; min height 48; pressed opacity 0.82; disabled background `surfaceAlt`, text `textMuted`.

### Secondary/dialog button
- Background `surfaceAlt`; text `text`; 1 dp border; pressed `surface`; equal-weight row.

### Destructive button
- Transparent with danger text or danger fill for final confirmation; never adjacent to an accidental primary without spacing.

### Option row
- Height auto (min 60); title 18–20 sp; description 13 sp, max 3 lines; chevron 16 dp right; trailing value in accent/monospace 13 sp.
- Dividers inset 12 dp.

### Stepper
- Text field 80–110 dp, monospace, centred, numeric keyboard.
- Four buttons: `<<`, `<`, `>`, `>>`; big steps 1.0 (A4/cents), small 0.1.
- Clamping happens on every action; invalid text restores last valid value on blur/save.

### Select dialog
- Single-choice rows; check marker; accessibility `selected` state.
- Tap commits immediately for preset/sample/analysis lists; display/compat/debug use explicit OK.

### View selector
- Bottom sheet on phones (max height 70%), centred dialog on tablets.
- Five views + separated Options row.
- Current view check; tapping closes sheet, animates view.

### Permission/error panel
- Icon, title, 1–3 sentence cause, primary action, secondary action, diagnostic detail collapsible.
- Audio error shows attempted kHz and direct “Change sample rate”.
- Never uses fake data while error is shown.

### Empty states
- Custom lists: tuner icon, “No custom instruments/temperaments yet”, “Create one” button.
- Chords: “Play two or more notes to detect a chord.”
- Tuner weak signal: “Listening…” with live RMS/confidence bar, no note fabrication.

## 7. Visualization specifications

### Instrument
- Outer ring: 72 radial ticks, three major groups; active ticks white/accent.
- Strobe band: 24–36 segments rotating around note display; ring radius 0.38×min dimension.
- Note inside ring: large note + octave; cents below; Hz below that.
- String rail: N up to 12; horizontal scroll if >6; each item note name + small octave; nearest outlined; in-tune green, flat blue, sharp orange.
- Radial phase: `angle = (elapsedSeconds * cents * 0.9) mod 360`, so 0 cents is stationary; sign dictates direction. No random noise.

### Dial & Strobe
- Dial arc from 210° to 330°? Use a 240° arc, −50…+50 cents; ticks every 2 cents, labels at −50/−25/0/+25/+50.
- Needle colour by sign; centre cap accent.
- Linear strobe: 10–14 evenly spaced slanted bars; translate by `(elapsed * cents * 6) mod spacing`; stationary within ±threshold (lock), otherwise drifting.
- Include note name above dial and a compact frequency/status row.

### Spectrogram
- 96 frequency bands displayed log-spaced 30 Hz–6 kHz (or Nyquist).
- 64–80 time columns; latest at right, scroll left. Each cell represented by a colour from the ramp.
- Background grid at octave frequencies (C2…C6), labels at left using note-name style; faint vertical time grid.
- Current detected frequency is a bright horizontal tick at the right edge with note label.
- Silence shows dark background, not random noise.

### Chords
- Grid: 12 root columns; 6 quality rows with labels on the left.
- Cell background opacity `0.08 + 0.65 * normalizedScore`; top cell accent border and glow.
- Root header uses note-name style; qualities labelled maj, min, maj7, min7, dom7, dim7.
- Large detected chord name and confidence above grid.
- If confidence below threshold: accent muted and “Play a chord…” instruction.

### BigStrobe
- Top 40%: note + octave, cents, status in an enormous condensed font.
- Middle: giant horizontal band of bars with high contrast, drift based on cents; edge arrows/bars indicating flat/sharp.
- Bottom: device-width frequency and view hint.
- Designed to remain legible at 320 dp width and in landscape.

## 8. Motion and animation

- View transitions: 280 ms ease-out, translateX 28% + fade 0.4→1; wraparound supports both directions.
- View selector: 220 ms slide-up/fade; backdrop 180 ms.
- Dialogs: 180 ms fade + 8 dp scale (0.98→1).
- Strobe: continuous 30–60 fps requestAnimationFrame; phase computed from measured cents, never a hardcoded loop.
- Status changes: 150 ms colour cross-fade; no excessive bounce.
- Reduced motion: if `AccessibilityInfo.isReduceMotionEnabled` is true, replace drifting strobes with static segmented state and disable view slide translation (cross-fade only).

## 9. Responsive behaviour

| Condition | Behaviour |
| --- | --- |
| width < 360 dp | smaller dial/readout, 2-line dialog buttons, string rail scroll |
| portrait phone | visualizer vertical; dial uses height-aware radius; options full width |
| landscape phone | top bar compact; dial restricted by height; spectrogram gets more vertical bands; BigStrobe uses full width |
| tablet | max content width; larger reading; dials capped so they don’t become huge |
| font scale > 1.2 | reading scales via `maxFontSizeMultiplier`; layout remains scrollable; controls wrap |
| reduced motion | static strobe segments; fade-only transitions |

Orientation follows settings: dynamic (sensor), locked landscape, or locked portrait. No dedicated tablet layout is required by the original, but content width/scale adapts.

## 10. Accessibility

- Every interactive element has `accessibilityRole`, `accessibilityLabel`, and state.
- Tuner reading is announced politely at most every 1.5 s when the note or in-tune state changes, not on every frame.
- Colour is never the only signal: text labels (“TUNE UP”, “TUNE DOWN”, “IN TUNE!”) and direction arrows accompany colour.
- Minimum contrast: primary text 15:1, secondary 6:1, accent on dark 9:1.
- Dialog focus trapping with `accessibilityViewIsModal`; back/escape closes; initial focus on title or first action.
- Text scales with system font settings; no fixed-height text containers except the tuner display, which clamps and uses `adjustsFontSizeToFit`-equivalent measurement.
- Buttons have 44 dp touch targets and visible pressed states.
- Dynamic type labels remain readable in both sharp and flat notation; accessibility labels spell out “E flat 3” rather than relying on “Eb3”.

## 11. Visual reconstruction note

The original renders its tuner via proprietary OpenGL assets that could not be executed on the available x86_64 emulator (the APK is ARM-only). The recreation therefore reconstructs geometry from the observed view names, native strings, help text, layout XML, colour conventions and public product descriptions. It does not attempt to pixel-copy proprietary artwork. Native values, live motion relationships and all interaction semantics are preserved.
