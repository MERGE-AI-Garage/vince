# Vince — System Architecture

```mermaid
graph TD
    subgraph Client["Browser (React / Vite)"]
        UI[Creative Studio UI]
        EXT[Chrome Extension\nSide Panel]
    end

    subgraph Voice["Voice Path"]
        LIVE[Gemini 2.5 Flash\nLive API\nWebSocket — bidirectional audio\n+ tool calling]
    end

    subgraph TextChat["Text Chat Path"]
        AGENT[brand-prompt-agent\nEdge Function\nGemini 3 Flash — function calling]
    end

    subgraph Generation["Creative Generation"]
        GCP_PKG[generate-creative-package\nEdge Function]
        IMG[Gemini 3.1 Flash Image Preview\nresponseModalities: TEXT + IMAGE\nInterleaved copy + images]
        VID[generate-creative-video\nEdge Function]
        VEO[Veo 3\nVideo generation]
    end

    subgraph SupabaseLayer["Supabase"]
        EF[19 Edge Functions\nDeno runtime]
        DB[(PostgreSQL\nbrands · generations\ndirectives · conversations)]
        STORE[Storage\ncreative assets · brand logos]
        RT[Realtime\ngeneration completion events]
    end

    subgraph GoogleCloud["Google Cloud"]
        LIVE
        IMG
        VEO
        CR[Cloud Run\nFrontend hosting]
    end

    %% Voice path
    UI -->|"audio stream"| LIVE
    LIVE -->|"tool calls"| EF
    EF <--> DB
    EF <--> STORE
    LIVE -->|"tool: generate_creative_package"| GCP_PKG
    GCP_PKG --> IMG
    IMG -->|"interleaved TEXT + IMAGE"| GCP_PKG
    GCP_PKG -->|"creative package"| DB

    %% Text chat path
    UI -->|"text message"| AGENT
    AGENT -->|"tool: generate_creative_package"| GCP_PKG
    AGENT <--> DB

    %% Video path
    UI -->|"tool: generate_video"| VID
    VID --> VEO
    VEO -->|"video URL"| VID
    VID --> DB

    %% Realtime
    DB -->|"generation events"| RT
    RT -->|"subscription"| UI

    %% Extension
    EXT -->|"same Supabase backend"| EF

    %% Hosting
    CR -->|"serves"| UI
```

## Key Design Decisions

**Two-model architecture.** Gemini Live API handles real-time voice and tool calling. Image generation requires a separate `generateContent` call because image models don't support function calling. When Vince decides to generate a creative package, the Live session fires a tool call, the backend makes a separate call with `responseModalities: ['TEXT', 'IMAGE']`, and results render on the frontend while Vince keeps talking.

**Brand intelligence pipeline.** Vince starts from nothing. Every brand is built live: website crawl → document import → profile synthesis → guardrail generation → prompt synthesis. The final synthesized prompt injects brand DNA (visual identity, photography style, color profile, tone of voice) into every generation call.

**Realtime generation updates.** Creative package generation takes 4–6 seconds. Rather than polling, the frontend subscribes to Supabase Realtime and renders results as they arrive, while the Live API plays filler speech to bridge dead air.

**Edge Functions (19 total).** All AI orchestration runs in Supabase Edge Functions (Deno runtime), keeping API keys server-side and enabling per-function scaling.
