---
layout: home

hero:
  name: "Vince"
  text: "AI-Powered Creative Director"
  tagline: Brief by voice. Generate on-brand campaigns in seconds — images, copy, and video, all conditioned on your brand's own intelligence.
  actions:
    - theme: brand
      text: Get Started →
      link: /user/01-welcome
    - theme: alt
      text: Architecture
      link: /architecture/01-system-overview

features:
  - icon: 🎤
    title: Voice-First Briefing
    details: Talk to Vince like you'd talk to a designer. Real-time bidirectional voice via Gemini Live WebSocket — no scripts, no templates, just natural language.
    link: /user/02-feature-guides
    linkText: Feature guides →
  - icon: 🧬
    title: Brand DNA
    details: Every generation is grounded in your brand's uploaded identity — visual style, tone of voice, product catalog, and compliance guardrails. Vince never hallucinates your brand.
    link: /creator/01-getting-started
    linkText: Creator guide →
  - icon: 🖼️
    title: Multi-Modal Output
    details: Images via Imagen 4, short-form video via Veo 3, copy in your brand's voice — and full campaign packages with every format your team needs, generated in parallel.
    link: /creator/02-generation-workflows
    linkText: Generation workflows →
  - icon: 📱
    title: Three Surfaces, One Codebase
    details: Identical capabilities on web browser, Chrome extension side panel, and native iOS/Android app — all sharing a single React/TypeScript component library.
    link: /developer/02-architecture-guide
    linkText: Architecture guide →
  - icon: ⚡
    title: Serverless by Design
    details: No custom server. Every backend capability — brand synthesis, image generation, RAG retrieval, conversation memory — runs as an isolated Supabase Edge Function.
    link: /developer/03-api-reference
    linkText: API reference →
  - icon: 🔒
    title: Brand Compliance Guardrails
    details: Admins define hard constraints — prohibited language, required disclosures, style rules — enforced at the prompt level before any generation reaches a model.
    link: /admin/07-system-administration
    linkText: System administration →
---

<br />

## How Vince Works

Vince is a conversation-driven orchestration layer over Google's AI stack. A brief — spoken or typed — triggers a pipeline that retrieves brand context, expands the prompt through brand-conditioned rules, fans out to the appropriate Gemini model, and streams results back to the user.

```mermaid
flowchart TD
    User(["👤 Marketing Practitioner"])

    subgraph Surfaces["Three Surfaces — shared codebase"]
        Web["🌐 Web App\nReact + Vite"]
        Ext["🧩 Chrome Extension\nSide Panel MV3"]
        Mobile["📱 iOS / Android\nCapacitor WebView"]
    end

    subgraph Backend["Supabase Backend — Edge Functions (Deno)"]
        BPA["brand-prompt-agent\nOrchestrates Gemini function calling"]
        GenImg["generate-creative-image\nImagen 4 / editing / upscaling"]
        GenVid["generate-creative-video\nVeo 3 video generation"]
        GenPkg["generate-creative-package\nParallel multi-format output"]
        SynthBrand["synthesize-brand-profile\nAI analysis of brand documents"]
    end

    subgraph AI["Google AI Stack"]
        GeminiText["Gemini 2.5 Flash\nText + reasoning"]
        GeminiLive["Gemini Live\nReal-time voice WebSocket"]
        Imagen["Imagen 4\nImage generation + editing"]
        Veo["Veo 3\nVideo generation"]
    end

    DB[("Supabase\nPostgres + RLS\nStorage + Auth")]

    User -->|HTTPS| Web
    User -->|HTTPS| Ext
    User -->|HTTPS| Mobile

    Web -->|Supabase JS SDK| Backend
    Ext -->|Supabase JS SDK| Backend
    Mobile -->|Supabase JS SDK| Backend

    Web <-->|WebSocket wss://| GeminiLive

    BPA --> GeminiText
    BPA --> DB
    GenImg --> Imagen
    GenVid --> Veo
    GenPkg --> Imagen

    Backend <--> DB
```

---

## Documentation by Audience

Each section is written for a specific reader — same system, different depth.

<div class="vp-doc" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.5rem;margin-top:1.5rem;">

<div>

**👤 End Users**
You're a marketer who generates campaigns, not a developer.

→ [Welcome & first brief](/user/01-welcome)
→ [Feature guides](/user/02-feature-guides)
→ [FAQ & troubleshooting](/user/03-faq)

</div>

<div>

**🎨 Creators & Power Users**
You run campaigns, manage prompts, and push what Vince can do.

→ [Generation workflows](/creator/02-generation-workflows)
→ [Prompt templates](/creator/03-prompt-templates)
→ [Media management](/creator/04-media-management)

</div>

<div>

**⚙️ System Admins**
You configure brands, manage users, and keep the platform running.

→ [Deployment guide](/admin/01-deployment-guide)
→ [Configuration reference](/admin/02-configuration-reference)
→ [Operations runbooks](/admin/06-operations-runbooks)

</div>

</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:1.5rem;">

<div>

**🛠️ Developers**
You build on top of Vince or contribute to the codebase.

→ [Getting started](/developer/01-getting-started)
→ [API reference](/developer/03-api-reference)
→ [Code patterns](/developer/07-code-patterns)

</div>

<div>

**🏗️ Architects**
You need to understand the system at depth — security, data, and decisions.

→ [System overview](/architecture/01-system-overview)
→ [C4 diagrams](/architecture/02-architecture-c4)
→ [Architecture decisions](/architecture/06-decisions-adr)

</div>

</div>

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript + Vite | All three surfaces — web, extension, mobile |
| **Mobile** | Capacitor | Native iOS/Android wrapper around the web bundle |
| **Extension** | Chrome Manifest V3 | Side panel with isolated auth client |
| **State** | Zustand + TanStack Query | Local UI state + server cache |
| **Backend** | Supabase Edge Functions (Deno) | All server-side AI orchestration |
| **Database** | PostgreSQL + Row-Level Security | Per-user data isolation enforced at the DB layer |
| **Voice** | Gemini Live WebSocket | Real-time bidirectional audio, <200ms round-trip |
| **Image** | Google Imagen 4 via Vertex AI | Text-to-image, editing, upscaling, virtual try-on |
| **Video** | Google Veo 3 | Short-form video generation from text briefs |
| **Text** | Gemini 2.5 Flash | Conversation, prompt expansion, brand reasoning |
| **Auth** | Supabase Auth + custom RLS | Email/password, role-based access (user/admin) |
| **Hosting** | Google Cloud Run | Containerized web app behind nginx |
