# Brand Coaching Mode

## What It Is

Vince can act as a creative director who briefs and educates team members on a brand — not just generate assets. When a user signals they're new to a brand or wants to understand it before they start working, Vince shifts into coaching mode and walks them through everything he knows.

This turns Vince from an asset generator into a team enablement platform. A junior art director can get fully briefed on a brand's visual DNA, photography standards, tone of voice, and compliance rules before touching a single prompt.

---

## How to Trigger It

Say anything that signals you want to learn or get oriented. Exact phrasing doesn't matter — Vince reads intent.

**Examples:**
- "I'm new to this brand, get me up to speed"
- "Walk me through this brand"
- "I'm a junior art director — brief me"
- "Get me familiar with the brand"
- "What should I know before I start shooting?"
- "Coach me on this brand"
- "How should I be shooting this brand?"
- "What's the color story here?"
- "What's the photography style?"

---

## What Vince Covers

Vince draws on everything in the brand's loaded profile. He doesn't recite guidelines back verbatim — he interprets them. What it means on set. What it means when you're writing a headline.

**Visual World**
- Color story: not hex codes, but what the palette communicates emotionally and how it behaves in layouts
- Visual DNA: the signature aesthetic feeling across the brand's image library
- Composition rules: framing conventions, negative space, what to avoid

**Photography Direction**
- Camera and lens: what equipment fits this brand and why — focal length, aperture behavior, depth of field
- Lighting: natural vs. studio, light quality (hard/soft), direction, color temperature
- Film stock or digital grade: grain, tonal rendering, post-production treatment
- Shot types: what the brand favors (hero product, lifestyle, close-up detail) and what it doesn't

**Brand Voice**
- How the brand speaks and what it refuses to say
- Formality, energy, personality — the emotional register

**Governance & Compliance**
- Logo placement rules: where it lives, safe space, what it never does
- Forbidden color combinations
- Casting and people direction if applicable
- Compliance rules that affect creative decisions directly

**Product Knowledge**
- How to describe products visually for generation (by visual characteristics, never by brand name)

---

## How the Briefing Works

1. Vince opens with a one-sentence positioning statement — what the brand is, who it's for, what makes it different. Not a list of facts. A creative director briefing a room.
2. He walks through the visual world first — color, photography, composition. The practical stuff.
3. Covers voice and messaging.
4. Hits compliance — what you can never do.
5. Asks one sharp follow-up question to pull you into a real conversation.
6. Offers to go hands-on: "Want to shoot something together?"

Coaching mode isn't a one-shot lecture. It stays conversational. You can ask Vince to go deeper on just photography, just tone, just color — he'll dig in.

---

## Greeting Integration

Vince's opening greeting now surfaces the coaching option contextually. When a brand profile is fully loaded, the greeting includes:

> *"Brand playbook loaded — N sources analyzed. Say 'walk me through this brand' and I'll brief you on the visual DNA, photography standards, tone, and compliance rules before we shoot."*

Several greeting variants also offer the briefing option directly:
- *"New to this brand? Say the word and I'll walk you through it. Otherwise, what's the shot?"*
- *"Want a quick brief on the brand, or straight into a generation?"*
- *"I've got the full [Brand] playbook — visual DNA, photography standards, tone, compliance. Where do you want to start?"*

---

## What This Enables

**Junior team members** can self-onboard on a brand without a dedicated training session. Vince handles the briefing.

**Agency teams** working across multiple client brands can switch contexts quickly. Brief a new account team in under two minutes.

**Freelancers and contractors** brought in for a single campaign get the full brand download before their first generation.

**Anyone** can deep-dive on a specific domain when they need a refresh — "remind me of the photography rules for this brand" works just as well.

---

## Technical Notes

- No new tools, no UI changes, no database changes
- Implemented as a behavioral instruction block in `buildSystemPrompt` in `supabase/functions/brand-prompt-agent/index.ts`
- Greeting templates updated in `src/services/brand-agent/brandAgentSettings.ts`
- Context callout updated in `src/services/brand-agent/brandAgentGeminiService.ts`
- Vince draws on all injected brand data: Visual DNA, Photography Standards, Color Profile, Composition Rules, Brand Identity, Tone of Voice, Typography, Product Catalog, and all active Directives
- If brand DNA is thin or missing, Vince says so and offers to build it before the briefing

---

*Added March 14, 2026*
