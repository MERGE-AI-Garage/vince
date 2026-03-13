# Vince Tool Reference

26 tools across 8 categories. Last updated 2026-03-11.

---

## Prompt & Template Management

| Tool | What it does |
|------|-------------|
| `save_prompt_template` | Save an approved prompt to the library with category, camera preset, model recommendation |
| `search_prompt_library` | Search saved templates by keyword or category |

---

## Brand Analysis & Intelligence

| Tool | What it does |
|------|-------------|
| `analyze_brand_website` | Crawl a brand website — extracts colors, fonts, imagery style, tone (async, 30–60s) |
| `analyze_brand_image` | Extract visual metadata from reference images — camera, lighting, composition, color, mood (async) |
| `import_brand_document` | Process a PDF/PPTX/DOCX brand document — extracts guidelines, tone, visual standards |
| `get_brand_profile` | Read the current Brand DNA profile — photography style, colors, composition, tone, typography |

---

## Brand Synthesis & Governance

| Tool | What it does |
|------|-------------|
| `synthesize_brand_profile` | Merge all intelligence sources into unified Brand DNA; triggers vector memory ingestion |
| `generate_brand_guardrails` | Generate AI governance directives for 1 or all 6 focus areas (visual identity, photography, tone, typography, product, compliance) |
| `recall_brand_guidelines` | Semantic search against brand vector memory — retrieves exact rules before generation |
| `generate_brand_playbook` | Full orchestration: synthesize → all guardrails → generation prompt → cards → starters (~2–3 min) |

---

## Image & Video Generation

| Tool | What it does |
|------|-------------|
| `generate_image` | Generate 1–4 images with full camera preset, logo injection, reference collections |
| `generate_creative_package` | Generate a complete campaign — interleaved copy + images in one call, with invisible brand RAG |
| `generate_video` | Generate a 4/6/8s brand video via Veo 3.1 Fast (~$0.80) or Quality (~$2.00); native audio included |

---

## Brand Setup & Visual Identity

| Tool | What it does |
|------|-------------|
| `create_brand` | Create a new brand record; auto-chains website analysis |
| `generate_brand_header` | Generate and save the brand hero/header image from DNA |
| `generate_brand_cards` | Generate the 5 stylized 3D UI card icons using brand colors |

---

## Reference Collections & Equipment

| Tool | What it does |
|------|-------------|
| `list_brand_references` | List reference image collections (product, character, style, environment) — use before generation |
| `list_camera_options` | List camera inventory with `prompt_fragment` values — paste verbatim into prompts |

---

## Quota & Models

| Tool | What it does |
|------|-------------|
| `check_generation_quota` | Remaining quota, limit, reset date |
| `list_available_models` | Fresh list of available image/video models with costs |

---

## Competitive Intelligence

| Tool | What it does |
|------|-------------|
| `analyze_competitor_content` | Analyze a competitor video — returns summary, weaknesses, 3 counter-campaign directions |
| `analyze_self_demo` | Watch a Vince demo recording and return a UX score + structured critique |

---

## Key Tool Chains

**Brand onboarding:**
```
create_brand → analyze_brand_website (auto)
→ import_brand_document (×N)
→ generate_brand_playbook  ← does everything else
```

**Single asset:**
```
list_brand_references → list_camera_options
→ recall_brand_guidelines → check_generation_quota
→ generate_image → save_prompt_template
```

**Campaign:**
```
generate_creative_package(brief)  ← auto-retrieves brand rules, generates all copy + images
```

**Competitive counter-campaign:**
```
analyze_competitor_content → [user picks 1 of 3 directions] → generate_creative_package
```

**Refresh brand intelligence:**
```
analyze_brand_website | import_brand_document | analyze_brand_image
→ synthesize_brand_profile → generate_brand_guardrails
```

---

## Gaps & Known Issues

### Missing tools
| Gap | Impact |
|-----|--------|
| `list_generations` | Vince can't show past work or iterate on previous results — the generation library is invisible to the agent |
| `manage_guardrails` | Vince can create guardrails but can't list, activate, deactivate, or delete them |
| `update_brand_profile` | No way to manually patch a specific Brand DNA field without re-running full synthesis |
| `list_brand_documents` | Vince can import documents but can't list what's been processed for a brand |
| `estimate_cost` | No pre-generation cost estimate — only quota count, no dollar visibility |
| `regenerate_starters` | Starters only generated inside `generate_brand_playbook` — no standalone re-run |

### Tools with design problems
| Tool | Problem |
|------|---------|
| `generate_video` | Fire-and-forget — Vince can't check status or retrieve the result; conversation dead-ends |
| `analyze_brand_image` | Same fire-and-forget problem — no confirmation of what was extracted |
| `generate_brand_playbook` | 2–3 min black box, no progress feedback, vague errors if a step fails |
| `recall_brand_guidelines` | Returns "no guidelines found" with no context — can't tell if memory is empty vs. wrong query |
