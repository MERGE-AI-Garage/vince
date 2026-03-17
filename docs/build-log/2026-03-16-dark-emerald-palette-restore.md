# Dark Emerald Palette Restore — 2026-03-16

## What happened

Between March 6 and March 16, the Creative Studio UI gradually lost its deep dark emerald appearance and shifted to a noticeably lighter, flatter viridian-green. The WelcomeScreen looked correct (it uses a hardcoded `#0D1B16` background) but all CSS-variable-driven surfaces — the parameters sidebar, history panel, tool cards, popovers — were rendering in a lighter mid-green that didn't match.

Root cause: `--cs-surface-*` lightness values in `src/index.css` were raised 3–4% in commits `513b10d` and surrounding work. At near-black values, +3% lightness is a ~40% relative increase — visually significant even though the numbers look small.

## What was changed

**File:** `src/index.css`
**Blocks:** `.dark` and `.dark .creative-studio` (both updated identically)

| Variable | Before (viridian) | After (dark emerald) |
|---|---|---|
| `--background` | `165 35% 10%` | `165 35% 7%` |
| `--card` | `165 28% 14%` | `165 30% 10%` |
| `--popover` | `165 28% 14%` | `165 30% 10%` |
| `--cs-surface-0` | `165 35% 10%` | `165 35% 7%` |
| `--cs-surface-1` | `165 28% 14%` | `165 30% 10%` |
| `--cs-surface-2` | `165 25% 17%` | `165 25% 13%` |
| `--cs-surface-3` | `165 35% 8%` | `165 35% 5%` |
| `--cs-border-subtle` | `165 20% 21%` | `165 20% 18%` |
| `--cs-border-mid` | `165 18% 28%` | `165 18% 25%` |

The `.brand-guidelines-panel` neutral overrides were not touched — those are intentionally light for the Brand DNA / Brand Standards dialogs.

## Reference screenshots

- `Brand-Lens-—-Voice-Driven-Creative-Director-03-06-2026_02_30_AM.png` — the target look (deep dark emerald)
- `Vince-—-Voice-Driven-Creative-Director-03-16-2026_08_59_AM.png` — the viridian state before this fix
