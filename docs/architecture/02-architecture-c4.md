# Architecture Diagrams (C4-style)

> Generated: 2026-03-15
> Based on: `src/App.tsx`, `src/main.tsx`, `mobile/src/MobileApp.tsx`, `extension/src/BrandApp.tsx`,
> `src/integrations/supabase/client.ts`, `src/services/brand-agent/`, `supabase/functions/`,
> `extension/manifest.json`, `Dockerfile`

---

## Level 1: System Context Diagram

```mermaid
graph TB
    subgraph Users
        MP[👤 Marketing Practitioner<br/>Creates prompts, generates assets]
        BM[👤 Brand Manager<br/>Uploads documents, sets guidelines]
        SA[👤 System Admin<br/>Configures models and quotas]
    end

    subgraph Vince["Vince — AI Creative Director"]
        App[🖥️ Vince App<br/>Web / Extension / Mobile]
    end

    subgraph External["External Services"]
        SB[🗄️ Supabase<br/>Database · Auth · Storage · Edge Functions]
        GM[🤖 Google Gemini API<br/>Text + Image generation]
        GL[🎙️ Gemini Live API<br/>Real-time voice WebSocket]
        VEO[🎬 Google Veo 3<br/>Video generation]
        GCR[☁️ Google Cloud Run<br/>Web app hosting]
    end

    MP -->|HTTPS browser / mobile| App
    BM -->|HTTPS browser| App
    SA -->|HTTPS browser| App
    App -->|Supabase JS SDK| SB
    App -->|Google GenAI SDK REST| GM
    App -->|WebSocket wss://| GL
    SB -->|Gemini API calls from Edge Functions| GM
    SB -->|Veo 3 API calls from Edge Functions| VEO
    App -->|Served from| GCR

    %% Generated from codebase analysis 2026-03-15
    %% Based on: src/App.tsx, src/integrations/supabase/client.ts,
    %%            src/services/brand-agent/brandAgentLiveService.ts,
    %%            supabase/functions/, Dockerfile
```

---

## Level 2: Container Diagram

```mermaid
graph TB
    subgraph Users
        User[👤 User]
    end

    subgraph WebSurface["Web App (React + Vite → nginx)"]
        WebUI[🌐 Web UI<br/>React 18 · TypeScript<br/>localhost:5173 / Cloud Run]
    end

    subgraph ExtSurface["Chrome Extension (MV3)"]
        ExtUI[🧩 Extension Side Panel<br/>React 18 · Manifest V3<br/>Chrome side panel]
    end

    subgraph MobileSurface["Mobile App (Capacitor)"]
        MobUI[📱 Mobile App<br/>React 18 · Capacitor<br/>iOS + Android web-view]
    end

    subgraph SupabaseBackend["Supabase Backend"]
        DB[(🗄️ PostgreSQL<br/>Brands · Generations · Campaigns)]
        Auth[🔐 Supabase Auth<br/>JWT · email+password]
        Storage[📁 Supabase Storage<br/>Images · Videos · Brand docs]
        EdgeFns[⚙️ Edge Functions<br/>Deno · AI orchestration]
    end

    subgraph GoogleAI["Google AI Services"]
        GeminiREST[🤖 Gemini REST API<br/>2.0 Flash · image generation]
        GeminiLive[🎙️ Gemini Live WS<br/>Real-time bidirectional audio]
        Veo3[🎬 Veo 3<br/>Video generation]
    end

    User -->|HTTPS| WebUI
    User -->|Chrome side panel| ExtUI
    User -->|iOS/Android| MobUI

    WebUI -->|Supabase JS SDK| DB
    WebUI -->|Supabase JS SDK| Auth
    WebUI -->|Supabase JS SDK| Storage
    WebUI -->|Supabase JS SDK| EdgeFns
    WebUI -->|Google GenAI SDK| GeminiREST
    WebUI -->|WebSocket wss://| GeminiLive

    ExtUI -->|Supabase JS SDK| DB
    ExtUI -->|Supabase JS SDK| Auth
    ExtUI -->|Supabase JS SDK| EdgeFns
    ExtUI -->|Google GenAI SDK| GeminiREST
    ExtUI -->|WebSocket wss://| GeminiLive

    MobUI -->|Supabase JS SDK| DB
    MobUI -->|Supabase JS SDK| Auth
    MobUI -->|Supabase JS SDK| EdgeFns
    MobUI -->|Google GenAI SDK| GeminiREST
    MobUI -->|WebSocket wss://| GeminiLive

    EdgeFns -->|REST| GeminiREST
    EdgeFns -->|REST| Veo3
    EdgeFns -->|SQL| DB
    EdgeFns -->|Object storage| Storage

    %% Generated from codebase analysis 2026-03-15
    %% Based on: src/integrations/supabase/client.ts,
    %%            extension/src/supabaseExtClient.ts,
    %%            src/services/brand-agent/brandAgentGeminiService.ts,
    %%            src/services/brand-agent/brandAgentLiveService.ts,
    %%            supabase/functions/
```

---

## Level 3: Component Diagram — Web App (src/)

```mermaid
graph TB
    subgraph Router["App Router (src/App.tsx)"]
        Routes[📡 Routes<br/>React Router v6]
        Auth[🔐 Auth Gate<br/>ProtectedRoute + AuthContext]
    end

    subgraph Pages["Pages (src/pages/)"]
        Studio[🎨 CreativeStudio<br/>/  /studio]
        Campaigns[📋 MyCampaigns<br/>/campaigns]
        Admin[⚙️ CreativeStudioAdmin<br/>/admin]
        VCP[🕹️ VinceControlPanel<br/>/vince]
        Showcase[🖼️ VinceShowcase<br/>/showcase — public]
    end

    subgraph CreativeStudioComponents["Creative Studio Components (src/components/creative-studio/)"]
        BAA[💬 BrandAgentApp<br/>Voice + chat interface]
        BrandIntel[🧠 BrandIntelligenceTab<br/>Brand DNA viewer]
        Creations[🖼️ CreationsTab<br/>Generation gallery]
        MediaLib[📁 MediaLibraryTab<br/>Asset library]
        CampaignB[📣 CampaignsTab<br/>Campaign builder]
    end

    subgraph Services["Services (src/services/brand-agent/)"]
        GeminiSvc[🤖 brandAgentGeminiService<br/>Brand context + REST generation]
        LiveSvc[🎙️ brandAgentLiveService<br/>Gemini Live WebSocket voice]
        Settings[⚙️ brandAgentSettings<br/>Prompts + defaults]
    end

    subgraph DataLayer["Data Layer"]
        Hooks[🔗 Custom Hooks<br/>src/hooks/ — React Query wrappers]
        SBClient[🗄️ Supabase Client<br/>src/integrations/supabase/client.ts]
    end

    Routes --> Auth
    Auth --> Pages
    Studio --> BAA
    Studio --> BrandIntel
    Studio --> Creations
    Studio --> MediaLib
    Studio --> CampaignB
    BAA --> GeminiSvc
    BAA --> LiveSvc
    BAA --> Settings
    GeminiSvc --> Hooks
    GeminiSvc --> SBClient
    LiveSvc --> SBClient
    Hooks --> SBClient

    %% Generated from codebase analysis 2026-03-15
    %% Based on: src/App.tsx, src/pages/, src/components/creative-studio/,
    %%            src/services/brand-agent/, src/hooks/, src/integrations/supabase/client.ts
```
