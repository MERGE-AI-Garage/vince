# Vince — Architecture Diagram

## System Architecture

```mermaid
%%{init: {'theme':'base', 'themeVariables': {
  'primaryColor':'#00856C',
  'primaryTextColor':'#ffffff',
  'primaryBorderColor':'#1ED75F',
  'lineColor':'#00856C',
  'secondaryColor':'#0D4A3A',
  'tertiaryColor':'#0D1B16',
  'clusterBkg':'#0D2B22',
  'clusterBorder':'#00856C',
  'titleColor':'#1ED75F',
  'edgeLabelBackground':'#0D2B22',
  'textColor':'#e0e0e0'
}}}%%
graph TB
    classDef client fill:#0D3B2E,stroke:#00856C,color:#e0e0e0,stroke-width:2px
    classDef orchestration fill:#00856C,stroke:#1ED75F,color:#ffffff,stroke-width:2px
    classDef gemini fill:#1a3a5c,stroke:#4285F4,color:#e0e0e0,stroke-width:1px
    classDef infra fill:#1a2a1a,stroke:#3ECF8E,color:#e0e0e0,stroke-width:1px
    classDef data fill:#1a2a2a,stroke:#3ECF8E,color:#e0e0e0,stroke-width:1px

    subgraph Clients["📱 Clients"]
        WEB["🌐 Web App<br/>React + Vite<br/>Cloud Run"]
        EXT["🔌 Chrome Extension<br/>Manifest V3<br/>Side Panel"]
        IOS["📱 iOS App"]
        AND["🤖 Android App"]
    end

    subgraph GCP["☁️ Google Cloud + Gemini"]
        LIVE["🎙️ Gemini Live API<br/>gemini-2.5-flash-native-audio<br/>Voice · 26 Tools · Orchestration"]
        FLASH["🎬 Gemini 2.0 Flash<br/>Multimodal Video Analysis<br/>Beat This Ad"]
        IMG["🖼️ Gemini 3.1 Flash Image Preview<br/>responseModalities: TEXT + IMAGE<br/>Interleaved Creative Packages"]
        VEO["🎥 Veo 3<br/>Campaign Video<br/>image-to-video"]
        EMB["🔢 text-embedding-004<br/>Brand Rule Vectorization"]
    end

    subgraph Supabase["⚡ Supabase Edge + Data"]
        EDGE["⚙️ 21 Edge Functions<br/>brand-prompt-agent<br/>generate-creative-package<br/>+ 19 more · Deno"]
        PG["🗄️ PostgreSQL + pgvector<br/>Brand DNA · Campaigns<br/>copy_blocks · Generations"]
        RT["📡 Supabase Realtime<br/>Async Job Push<br/>History Panel"]
        STG["📦 Storage<br/>Images · Documents<br/>Brand Assets · Headshots"]
    end

    WEB -->|"WSS · 16kHz PCM audio"| LIVE
    EXT -->|"WSS · 16kHz PCM audio"| LIVE
    IOS -->|"WSS · 16kHz PCM audio"| LIVE
    AND -->|"WSS · 16kHz PCM audio"| LIVE

    LIVE -->|"tool_call · fire-and-forget"| EDGE

    EDGE -->|"Competitor video URL<br/>MP4 multimodal analysis"| FLASH
    EDGE -->|"Brand brief + injected DNA<br/>responseModalities: TEXT+IMAGE"| IMG
    EDGE -->|"text-to-video<br/>image-to-video"| VEO
    EDGE -->|"Chunk + vectorize<br/>brand rules"| EMB

    EMB -.->|"store vectors"| PG
    PG -.->|"recall_brand_guidelines<br/>cosine similarity"| EDGE

    EDGE <-->|"read · write · RLS"| PG
    EDGE -->|"upload assets"| STG
    RT -->|"job complete<br/>push to History"| WEB

    class WEB,EXT,IOS,AND client
    class LIVE orchestration
    class FLASH,IMG,VEO,EMB gemini
    class EDGE infra
    class PG,RT,STG data

    %% Generated 2026-03-15
    %% Source: brand-prompt-agent/index.ts, generate-creative-package/index.ts
    %% brandAgentLiveService.ts, brandAgentGeminiService.ts
```

---

## Key Flow: Beat This Ad

```mermaid
%%{init: {'theme':'base', 'themeVariables': {
  'primaryColor':'#00856C',
  'primaryTextColor':'#ffffff',
  'primaryBorderColor':'#1ED75F',
  'lineColor':'#00856C',
  'clusterBkg':'#0D2B22',
  'edgeLabelBackground':'#0D2B22',
  'textColor':'#e0e0e0'
}}}%%
sequenceDiagram
    participant U as 👤 You
    participant L as 🎙️ Gemini Live API
    participant E as ⚙️ brand-prompt-agent
    participant F as 🎬 Gemini 2.0 Flash
    participant UI as 🌐 UI

    U->>L: "Analyze this competitor ad" + YouTube URL
    L->>E: tool_call: analyze_competitor_video(url)
    Note over L,E: Stub returned immediately — session stays alive
    E->>F: MP4 multimodal analysis request
    F-->>E: Hooks · messaging · weaknesses · openings
    E-->>UI: Competitive Intel card via Supabase Realtime
    L-->>U: "Analysis complete. Three counter-directions ready."
    U->>L: "Take direction two. Build me a full campaign."
    Note over U,L: → triggers Creative Package flow

    %% Generated 2026-03-15
```

---

## Key Flow: Interleaved Creative Package

```mermaid
%%{init: {'theme':'base', 'themeVariables': {
  'primaryColor':'#00856C',
  'primaryTextColor':'#ffffff',
  'primaryBorderColor':'#1ED75F',
  'lineColor':'#00856C',
  'clusterBkg':'#0D2B22',
  'edgeLabelBackground':'#0D2B22',
  'textColor':'#e0e0e0'
}}}%%
sequenceDiagram
    participant L as 🎙️ Gemini Live API
    participant E as ⚙️ generate-creative-package
    participant V as 🧠 pgvector RAG
    participant I as 🖼️ Gemini 3.1 Flash Image
    participant RT as 📡 Realtime
    participant UI as 🌐 Campaigns Tab

    L->>E: tool_call: generate_creative_package(brief, deliverables)
    Note over L,E: Stub returned immediately — voice session stays open
    E->>V: recall_brand_guidelines(brief, brand_id)
    V-->>E: Visual DNA · Photography · Tone · Compliance rules
    E->>I: generateContent(brand_brief + DNA)<br/>responseModalities: ['TEXT', 'IMAGE']
    Note over I: Single API call →
    I-->>E: [text: strategy] [image: visual]<br/>[text: LinkedIn copy] [image: LinkedIn]<br/>[text: email body] [image: email header]
    E->>E: Store copy_blocks JSONB + upload images
    E-->>RT: job complete · generation_id
    RT-->>UI: Campaign arrives in History + Campaigns tab

    %% Generated 2026-03-15
```

---

## Key Flow: Person-in-Scene → Campaign

```mermaid
%%{init: {'theme':'base', 'themeVariables': {
  'primaryColor':'#00856C',
  'primaryTextColor':'#ffffff',
  'primaryBorderColor':'#1ED75F',
  'lineColor':'#00856C',
  'clusterBkg':'#0D2B22',
  'edgeLabelBackground':'#0D2B22',
  'textColor':'#e0e0e0'
}}}%%
sequenceDiagram
    participant U as 👤 You + headshot
    participant L as 🎙️ Gemini Live API
    participant E as ⚙️ brand-prompt-agent
    participant H as 🖼️ Gemini 3.1 Flash Image
    participant P as ⚙️ generate-creative-package
    participant UI as 🌐 Campaign

    U->>L: "Put me in this as a Google Partner promo"
    L->>E: tool_call: generate_headshot_scene(photo_url, scene)
    E->>H: IMAGE-only · face-preservation prompt
    Note over H: IMAGE modality only<br/>TEXT+IMAGE drops generation with inline images
    H-->>E: Scene image with preserved face
    E->>P: generate_creative_package(brief,<br/>pre_generated_image_url=scene_url)
    Note over P: Copy-only path — gemini-2.0-flash TEXT<br/>Image skipped — face preserved exactly
    P-->>UI: Campaign · your face · on-brand copy

    %% Generated 2026-03-15
```

---

## Why Two Models

| Model | Role | Why Separate |
|-------|------|-------------|
| `gemini-2.5-flash-native-audio` | Voice + tool orchestration | Real-time bidirectional audio, session lifecycle, 26 tool calls mid-conversation |
| `gemini-2.0-flash` | Video analysis + copy-only generation | Multimodal input (video), fast text; used when image already exists |
| `gemini-3.1-flash-image-preview` | Interleaved TEXT+IMAGE output | Only model supporting `responseModalities: ['TEXT', 'IMAGE']` |
| `text-embedding-004` | Brand memory vectors | Semantic retrieval — relevant rules for each generation type, not a full profile dump |
| `Veo 3` | Campaign video | Dedicated video generation; async job, fire-and-forget |

> Image generation models don't support function calling. This isn't a workaround — it forced a clean separation: Live API as pure orchestration, image model as pure creative execution. Each at its ceiling.
