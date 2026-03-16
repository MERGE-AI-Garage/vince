# Glossary

Common Vince terms in plain language.

---

## B

**Brand DNA**
Everything Vince knows about your brand — colors, voice, photography rules, and compliance guidelines. Vince applies this automatically to every image and campaign he generates. Think of it as your brand brief, always loaded and ready.

CONFIRMED: `BrandDNADialog.tsx`, `BrandDNABuilder.tsx`, `creative_studio_brand_profiles` table

---

**Brief**
The instruction you give Vince. Can be spoken or typed. A good brief tells Vince what you're making, who it's for, and what mood or tone to use. *"Campaign for our fall collection targeting women 25–40, warm and aspirational."*

---

## C

**Campaign Package**
A complete set of creative assets Vince generates from a single brief. Includes copy and images adapted for multiple formats (billboard, social, email, OOH, and more). Delivered together, ready to hand off.

CONFIRMED: `generate_creative_package` tool, `GenerationsTab.tsx`

---

**Creative Package**
Same as Campaign Package. The badge "Creative Package Ready" appears in chat when Vince finishes.

CONFIRMED: "Creative Package Ready" badge text in `BrandAgentApp.tsx`

---

## G

**Generation**
One image, video, or set of assets that Vince creates. Each generation is saved automatically and appears in your history.

CONFIRMED: `creative_studio_generations` table

---

**Generations Tab**
The full library of everything Vince has made for you (and your team, if you're an admin). Searchable and filterable by type, date, model, and status.

CONFIRMED: `GenerationsTab.tsx`

---

**Guardrails**
Rules Vince follows to keep every output on-brand and compliant — things like "always show the product on a white background" or "never use these competitor phrases." Set up by your admin from your brand standards.

CONFIRMED: `creative_studio_brand_guardrails` table, `generate-brand-guardrails` edge function

---

## H

**History Panel**
The left sidebar showing thumbnail previews of your recent generations. Click any thumbnail to bring it back to the canvas.

CONFIRMED: `HistoryPanel.tsx`

---

## I

**Inpaint / Edit Mode**
A generation mode where you edit a specific part of an existing image instead of generating from scratch. Example: swap the background, remove an object, or add a product.

CONFIRMED: Edit mode in `BrandShopPromptBar.tsx`

---

## M

**Media Library**
Your brand's uploaded assets — logos, reference images, product photos. Vince can pull from these when generating.

CONFIRMED: `media` table, media library tab in the interface

---

**My Campaigns**
A page showing your campaign history — generated packages you can browse and download.

CONFIRMED: `src/pages/MyCampaigns.tsx`

---

## P

**Prompt**
The text of a brief. Often used interchangeably with "brief." Prompts can be saved to the Prompt Library for reuse.

---

**Prompt Library**
A saved collection of briefs that worked well. Browse, search, and load saved prompts to reuse them. Supports variable placeholders like <code v-pre>{{product_name}}</code>.

CONFIRMED: `creative_studio_brand_prompts` table, `PromptLibraryPanel.tsx`

---

## Q

**Quota**
The number of generations your team is allowed in a given period. Vince shows your remaining balance. Contact your admin if you need more.

CONFIRMED: `check_generation_quota` tool, quota display in `BrandAgentApp.tsx`

---

## V

**Vince**
Your AI creative director. Brief him by voice or text, and he generates campaigns grounded in your brand's DNA.

---

**Voice Mode**
The hands-free way to work with Vince. Click the microphone, speak your brief, and Vince responds in real time. Uses Gemini Live for low-latency, back-and-forth conversation.

CONFIRMED: Gemini Live integration in `BrandAgentApp.tsx`

---

## Z

**ZIP Download**
When a campaign package is ready, you can download all formats as a single ZIP file for handoff to your production team.

INFERRED: Referenced in generation package UI; handoff workflow documented in codebase comments.
