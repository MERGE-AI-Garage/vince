# CTO Meeting — Kyle Miller & Kurt Miller
**Date:** March 13, 2026
**Purpose:** Project status + role clarity

---

## 1. Vince — Where We Are

### What it is

Vince is a voice-driven AI creative director for brand teams. You brief a campaign by voice and get a complete creative package — headlines, body copy, and images — all automatically grounded in your brand's guidelines. Built as the AI Garage's first internal platform product.

**The problem it solves:** 700 people, 50+ AI tools, 700 different versions of the brand prompt. Every AI output starts from scratch, inconsistent, ungoverned. Vince puts the brand in the prompt automatically, everywhere.

---

### What's built and working

| Capability | Status |
|---|---|
| Voice interface (Gemini Live API — real bidirectional audio) | ✅ Working |
| Tool calling mid-conversation (26 tools, 8 categories) | ✅ Working |
| Interleaved copy + image generation in a single pass | ✅ Working |
| Brand intelligence pipeline (website crawl → guidelines → guardrails) | ✅ Working |
| Brand document import & semantic search (RAG) | ✅ Working |
| Chrome Extension (brand context travels with the prompt, everywhere) | ✅ Working |
| Supabase backend: 19 Edge Functions, Auth, Storage, Realtime | ✅ Working |
| Google Cloud Run deployment | ✅ Working |
| Tests passing, API keys in vault | ✅ Working |

**Current activity:** Submitting to the Google Gemini Live Agent Challenge. Deadline March 16, 5PM PDT. Demo video and final docs in progress.

---

### Why it matters competitively

- **Adobe GenStudio** — locked to Adobe ecosystem only
- **Jasper** — text only, no image generation
- **Agency platforms** — closed, proprietary, not available to us
- **Vince** — governs input *before* generation, works across any AI tool via the Chrome extension, built on open APIs we control

The two-model architecture (Gemini Live for voice + orchestration, Gemini Flash Image for interleaved text/image generation) is a genuine technical differentiator — it's not a tutorial project.

---

### What's left for submission (March 16)

- 4-minute demo video
- `check_job_status` tool (closes the video generation loop — 2-3 hrs)
- Architecture diagram (in progress)
- Final DevPost write-up

The app is real. The API integration is real. The submission is strong.

---

## 2. Role Question — My Place Going Forward

### What I understand is happening

- Vince transitions to engineering to productionize and scale
- I've been told I won't be developing anymore

I want to use this meeting to get clarity, because right now I don't have a clear picture of what my role looks like after this handoff.

---

### Questions I need answered

1. **What does "not developing" mean specifically?**
   No new features on Vince? No prototyping of new tools? No proof-of-concept work for future AI Garage products?

2. **Is hands-on building part of the Director of AI Enablement role going forward, or not?**
   I need to know this clearly to plan my work and my team.

3. **If engineering owns the platform, what does AI Enablement own?**
   Strategy? Governance? Adoption and training? New product ideation? I'm fine with any of these, but I need to know.

4. **Was this always the plan (build it, hand it off), or is this a change in direction?**
   If it's the plan, great — I just need the next chapter. If something changed, I'd like to understand what.

5. **What does success look like for my role in the next 6 months?**

---

### My position

Hands-on building is not a side project for an AI Enablement director — it's how the job works at the frontier.

You can't write governance policy for tools you haven't used. You can't enable teams to build with AI if you haven't built with AI yourself. Vince wasn't me going rogue — it was me identifying a real problem, proving a solution, and creating something the agency can now actually use.

The question I need answered is: going forward, does this organization want a Director of AI Enablement who builds, or one who doesn't? Because those are genuinely different roles, and I want to make sure we're aligned on which one I'm supposed to be.

---

## Notes / Action Items

*(space for meeting notes)*

