<!-- ABOUTME: System administration guide for the Vince admin UI at /admin and /vince. -->
<!-- ABOUTME: Covers the Creative Studio Admin dashboard and the Vince Control Panel, their tabs, and key operations. -->

# System Administration

## Admin Surfaces Overview

Vince has two admin surfaces, both requiring `admin` role. (✅ CONFIRMED — `src/App.tsx`, `src/pages/VinceControlPanel.tsx`, `src/pages/CreativeStudioAdmin.tsx`)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin` | `CreativeStudioAdmin` | Platform management: brands, models, campaigns, generations, media, analytics |
| `/vince` | `VinceControlPanel` | AI agent configuration: voice, chat, prompts, brand intelligence, conversations |

Both routes are auth-protected (`ProtectedRoute`) but do not enforce admin role at the router level. `/vince` renders an "Access Denied" screen for non-admins. ⚠️ INFERRED: `/admin` likely has the same guard — verify by reading `CreativeStudioAdmin` render logic.

---

## Access Control

### Granting Admin Access

Admin access requires the `admin` role in the `user_roles` table. See Runbook-003 for the full procedure.

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('USER_UUID_HERE', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

The admin navigation link appears automatically in the sidebar for users with the `admin` role. (✅ CONFIRMED — `src/components/ui/navigation.tsx:34`)

---

## Creative Studio Admin (`/admin`)

Primary administration dashboard with 8 main tabs plus a Settings sub-section.

```mermaid
graph TD
    A[/admin] --> Brands
    A --> BrandDNA[Brand DNA]
    A --> Campaigns
    A --> Generations
    A --> Media
    A --> Downloads
    A --> WelcomePage[Welcome Page]
    A --> Settings
    Settings --> AIModels[AI Models]
    Settings --> CameraPresets[Camera Presets]
    Settings --> Analytics
    Settings --> UserQuotas[User Quotas]
    Settings --> AuditTrail[Audit Trail]
    Settings --> PromptHistory[Prompt History]
```

(✅ CONFIRMED — `src/pages/CreativeStudioAdmin.tsx` file header comment)

### Brands Tab

Manage all brands in the system.

**Operations available:**
- Create a new brand (opens `BrandEditorDialog`)
- Edit brand name, colors, logo, and metadata
- Toggle brand active/inactive
- Set a brand as default
- Delete a brand (requires confirmation)
- Launch **Brand DNA Builder** — runs the full brand intelligence pipeline on a brand

**After creating a brand,** a toast appears offering to run the Brand DNA Builder. Run it to build Visual DNA, color profile, and brand guardrails from the brand's website and uploaded assets.

### Brand DNA Tab

View and edit the brand intelligence profile for each brand.

- Select a brand from the dropdown
- View or edit structured brand DNA (visual identity, tone of voice, photography style, etc.)
- Manage prompt versions for the brand's generation prompt (version history via `prompt_versions` table — ✅ CONFIRMED — `supabase/migrations/20260313211248_add_prompt_versions.sql`)

### Campaigns Tab

Review and manage generated creative campaigns across all brands and users.

### Generations Tab

View all AI-generated images and creative packages across the system.

**Admin-specific capabilities:**
- View all users' generations (non-admins see only their own — ✅ CONFIRMED — `src/components/creative-studio/HistoryPanel.tsx:39`)
- Archive a generation (soft-delete: sets `archived_at` — ✅ CONFIRMED — `supabase/migrations/20260315000000_add_archived_at_to_generations.sql`)
- Delete a generation (hard-delete — requires admin role via RLS policy — ✅ CONFIRMED — `supabase/migrations/20260315000001_allow_admin_delete_generations.sql`)

### Media Tab

Manage the media library (`media` storage bucket). View, tag, and delete uploaded brand assets and generated images.

### Settings → AI Models

Configure which AI models are available for generation.

**Operations:**
- Add a new model (specify model ID, provider, capabilities, cost per generation)
- Edit an existing model
- Toggle a model active/inactive
- Set a model as default
- Delete a model

**Model capabilities** can include: `text_to_image`, `text_to_video`, `image_to_video`, `inpainting`, `outpainting`, `upscaling`, `masking`, `editing`, `multi_turn_edit`, `multi_image_fusion`, `typographic_rendering`, `grounding`, `reference_images`, `product_recontext`, `virtual_try_on`, `audio_generation`, `keyframe_video`, `scene_extension`, `video_inpainting`, `json_prompt`. (✅ CONFIRMED — `src/pages/CreativeStudioAdmin.tsx:196-210`)

### Settings → Camera Presets

Manage camera intelligence presets used in generation prompts. (✅ CONFIRMED — `CameraIntelligenceAdmin` component imported in `CreativeStudioAdmin`)

### Settings → User Quotas / Analytics

Review per-user generation usage and cost data. The `cost_per_generation` field on models is used to calculate costs. (✅ CONFIRMED — model form includes `cost_per_generation`)

### Settings → Audit Trail

Review a log of admin actions. (✅ CONFIRMED — `AuditTrailTab` component imported)

### Settings → Prompt History

Browse the history of brand generation prompts and their versions. (✅ CONFIRMED — `PromptHistoryTab` component imported, backed by `brand_prompt_history` table)

---

## Vince Control Panel (`/vince`)

Configures the AI creative director agent: how it greets users, what voice it uses, and what brand intelligence rules it follows.

```mermaid
graph TD
    V[/vince] --> Voice
    V --> Chat
    V --> Prompts
    V --> BrandIntel[Brand Intel]
    V --> Conversations
```

(✅ CONFIRMED — `src/pages/VinceControlPanel.tsx:33`)

### Voice Tab

Configure Vince's voice mode behavior:
- Select voice persona (Gemini Live API voice options)
- Adjust voice-mode system prompt
- Configure audio settings

### Chat Tab

Configure chat-mode behavior:
- Quick prompts (shortcut buttons shown to users)
- Enable/disable image upload in chat
- Chat-mode greeting behavior

### Prompts Tab

Manage greeting templates — the messages Vince uses to open conversations:
- View all greeting templates
- Edit existing templates
- Add new templates
- Set which templates are active

### Brand Intel Tab

Configure brand intelligence directives — rules that shape how Vince responds to each brand:
- View active directives (`creative_studio_agent_directives` table)
- Add or edit directives
- Toggle directives active/inactive

### Conversations Tab

Browse conversation history for all users interacting with Vince:
- Filter by user, brand, date
- View full conversation transcripts
- Backed by `chatbot_conversations` table with `metadata.assistant = 'vince'` filter (✅ CONFIRMED — `src/pages/VinceControlPanel.tsx:81`)

---

## Quick Stats on the Vince Control Panel

The `/vince` dashboard surface shows four stat cards: Greeting Templates, Quick Prompts, Brand Directives, and Conversations. Each card links to its respective tab. (✅ CONFIRMED — `src/pages/VinceControlPanel.tsx:127-195`)

---

## Navigation

The admin navigation link renders in the sidebar only for users with `isAdmin === true`. (✅ CONFIRMED — `src/components/ui/navigation.tsx:34`)

Clicking the link in the navigation goes to `/admin`. The `/vince` route is accessed separately (e.g., from a link within `/admin` or by direct URL).
