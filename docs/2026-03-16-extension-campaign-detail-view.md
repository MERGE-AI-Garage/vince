# Chrome Extension: Campaign Detail View — 2026-03-16

Adds a campaign detail panel to the extension's Campaigns tab, matching the web app's behavior of showing copy and images from stored generation data.

---

## Campaign Archive: Detail View

**Files:** `extension/src/chat/CampaignHistoryPanel.tsx`, `extension/src/chat/ChatTab.tsx`, `extension/src/BrandApp.tsx`, `src/hooks/useCreations.ts`

### Problem

Clicking a campaign in the extension's Campaigns tab only pasted the original prompt back into the chat input for re-generation. The re-generated response came back as plain text with raw CDN URLs overflowing the container — no images, no formatted copy card.

The web app's Campaigns tab, by contrast, opens a modal with a full `CreativePackageDisplay` card populated from the stored generation data (`copy_blocks` + `output_urls`).

### Fix

**`useCreations` hook** — Added `copy_blocks` to the Supabase select query and the `Generation` type. This field holds the interleaved text/image parts written at generation time.

**`CampaignHistoryPanel`** — Replaced the click-to-paste behavior with a full-panel detail view:
- Clicking a campaign list item opens `CampaignDetail`, which renders the stored data via `CreativePackageCard` on a dark background (consistent with how it looks in the live chat)
- A ← Back button returns to the list
- A Regenerate button at the bottom pushes the original prompt to chat for re-generation if needed

**`ChatTab` / `BrandApp`** — Threaded `brandName` down from `BrandApp` → `ChatTab` → `CampaignHistoryPanel` so the detail card has the brand name to display.

### Data mapping

| `CreativePackageCard` prop | Source |
|---|---|
| `parts` | `generation.copy_blocks` |
| `imageUrls` | `generation.output_urls` (image extensions only) |
| `latencyMs` | `generation.generation_time_ms` |
| `brandName` | `selectedBrand.name` (via prop) |
| `model` | `generation.model_used` |
| `brief` | `generation.prompt_text` |
| `deliverableNames` | `generation.parameters.deliverable_names` |
| `brandAlignment` | `generation.metadata.brand_alignment` |
