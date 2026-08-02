# AirVIA Restyle Report — Dark → Keychron Launcher Light Theme

**Date:** 2026-08-02  
**Build:** ✅ `pnpm build` — passes  
**Tests:** ✅ 5 files, 84 tests — all pass  
**Approach:** CSS-class-only changes in `.svelte` files, `index.html`, and `app.css`. Zero JS/logic changes.

## Files Changed (15)

| File | Changes |
|------|---------|
| `index.html` | `<body>` bg-white text-slate-700 |
| `src/app.css` | Scrollbar styling: thin, slate thumb |
| `src/App.svelte` | Outer bg-slate-50, drag-drop overlay bg-black/20, JSON button light |
| `src/ui/ConnectBar.svelte` | bg-white, logo text-blue-600, rounded-full buttons, state badge pill |
| `src/ui/TabBar.svelte` | Pill container bg-slate-100 rounded-full, pill tabs with shadow |
| `src/ui/LayerSelector.svelte` | bg-white, rounded-full layer pills, active shadow |
| `src/ui/KeymapGrid.svelte` | cellSize 52px, slate-400 empty state |
| `src/ui/KeymapCell.svelte` | bg-white cards border-slate-200 rounded-lg shadow-sm, blue hover/select |
| `src/ui/KeycodePicker.svelte` | Rounded-full search, pill category tabs, slate-50 tiles |
| `src/ui/EncoderEditor.svelte` | Rounded-full search, pill tabs, light encoder cards, white buttons |
| `src/ui/MacroEditor.svelte` | bg-white, rounded-full slot buttons, light hex grid |
| `src/ui/LightingPanel.svelte` | White card, accent-blue-500 slider, clean labels |
| `src/ui/LayoutOptions.svelte` | White card rounded-xl, blue-50 hex badge rounded-full |
| `src/ui/Console/PacketLog.svelte` | bg-slate-50 rounded-xl, TX=blue-600, RX=emerald-600 |
| `src/ui/shared/Modal.svelte` | bg-white rounded-2xl shadow-xl, bg-black/20 overlay, rounded-full close |
| `src/ui/shared/Toast.svelte` | Rounded-2xl toast cards |

## Color Mapping Applied

| Old Dark | New Light |
|----------|-----------|
| bg-gray-950/900/800/700 | bg-white, bg-slate-50, bg-slate-100 |
| text-gray-100/200/300 | text-slate-800/700/600 |
| text-gray-400/500 | text-slate-500/400 |
| border-gray-700/800 | border-slate-200/100 |
| hover:bg-gray-700/600 | hover:bg-slate-100/200 |
| bg-black/60 | bg-black/20 |
| bg-blue-900/30 | bg-black/20 |
| text-blue-400/300/200 | text-blue-600/700 |
| hover:bg-blue-900 | hover:bg-blue-100 |
| accent-pink-500 | accent-blue-500 |
| text-green-400 | text-emerald-600 |

## Border-radius Updates

- Buttons: `rounded` → `rounded-full`
- Modals/cards: `rounded-lg` → `rounded-xl` or `rounded-2xl`
- Toast: `rounded-lg` → `rounded-2xl`
- Keycode tiles: `rounded` → `rounded-lg`
- JSON load button: `rounded-lg` → `rounded-xl`

## Skipped

- No Tailwind config changes needed — all styles done via utility classes
- Icon.svelte untouched — SVG `fill="currentColor"` inherits parent text color
- No new dependencies added
