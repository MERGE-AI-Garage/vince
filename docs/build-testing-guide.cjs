const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageBreak, Header, Footer, PageNumber
} = require('docx');
const fs = require('fs');

// ─── Helpers ────────────────────────────────────────────────────────────────

const FULL_WIDTH = 9360;
const gray = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const grayBorders = { top: gray, bottom: gray, left: gray, right: gray };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}

function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}

function h3(text) {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22, color: "222222" })]
  });
}

function body(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 20 })]
  });
}

function italic(text) {
  return new Paragraph({
    spacing: { before: 60, after: 100 },
    children: [new TextRun({ text, italics: true, size: 20, color: "555555" })]
  });
}

function checkbox(text, indent = 360) {
  return new Paragraph({
    indent: { left: indent },
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text: "\u2610  " + text, size: 20, font: "Arial" })]
  });
}

function badge(text, color = "F3F4F6") {
  return new Paragraph({
    spacing: { before: 100, after: 80 },
    children: [
      new TextRun({ text: "  " + text + "  ", bold: true, size: 18, color: "374151",
        shading: { fill: color, type: ShadingType.CLEAR } })
    ]
  });
}

function gap(pts = 120) {
  return new Paragraph({ spacing: { before: pts } });
}

function notesBox(lines = 3) {
  const lineRows = [];
  for (let i = 0; i < lines; i++) {
    lineRows.push(
      new Paragraph({
        spacing: { before: 160 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" } },
        children: [new TextRun({ text: " ", size: 20 })]
      })
    );
  }
  return new Table({
    columnWidths: [FULL_WIDTH],
    margins: { top: 80, bottom: 80, left: 160, right: 160 },
    rows: [
      new TableRow({ children: [
        new TableCell({
          borders: grayBorders,
          width: { size: FULL_WIDTH, type: WidthType.DXA },
          shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
          children: [
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [new TextRun({ text: "Notes", bold: true, size: 18, color: "6B7280" })]
            }),
            ...lineRows,
            new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: " " })] })
          ]
        })
      ]})
    ]
  });
}

function stepList(steps) {
  return steps.map((s, i) =>
    new Paragraph({
      indent: { left: 440, hanging: 280 },
      spacing: { before: 60, after: 60 },
      children: [
        new TextRun({ text: `${i + 1}.  `, bold: true, size: 20, color: "4B5563" }),
        new TextRun({ text: s, size: 20 })
      ]
    })
  );
}

function sectionHeader(num, title, color = "1D4ED8") {
  return new Table({
    columnWidths: [FULL_WIDTH],
    margins: { top: 80, bottom: 80, left: 200, right: 200 },
    rows: [
      new TableRow({ children: [
        new TableCell({
          borders: noBorders,
          width: { size: FULL_WIDTH, type: WidthType.DXA },
          shading: { fill: "EFF6FF", type: ShadingType.CLEAR },
          children: [new Paragraph({
            spacing: { before: 80, after: 80 },
            children: [
              new TextRun({ text: `Section ${num}  `, bold: true, size: 24, color: color }),
              new TextRun({ text: title, bold: true, size: 24, color: "1E293B" })
            ]
          })]
        })
      ]})
    ]
  });
}

function resultRow(id, name) {
  const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" };
  const b = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
  return new TableRow({ children: [
    new TableCell({ borders: b, width: { size: 720, type: WidthType.DXA },
      children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: id, size: 18, color: "374151" })] })] }),
    new TableCell({ borders: b, width: { size: 4320, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: name, size: 18 })] })] }),
    new TableCell({ borders: b, width: { size: 1080, type: WidthType.DXA },
      children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "\u2610", size: 20 })] })] }),
    new TableCell({ borders: b, width: { size: 3240, type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: " ", size: 18 })] })] }),
  ]});
}

// ─── Document ────────────────────────────────────────────────────────────────

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, color: "111827", font: "Arial" },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: "1D4ED8", font: "Arial" },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
    ]
  },
  numbering: { config: [
    { reference: "steps", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 440, hanging: 280 } } } }] }
  ]},
  sections: [{
    properties: {
      page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } }
    },
    headers: {
      default: new Header({ children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" } },
          spacing: { after: 120 },
          children: [
            new TextRun({ text: "Brand Lens — Testing Guide", size: 18, color: "6B7280" }),
            new TextRun({ text: "  |  Updated Mar 8, 2026", size: 18, color: "9CA3AF" })
          ]
        })
      ]})
    },
    footers: {
      default: new Footer({ children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" } },
          spacing: { before: 120 },
          children: [
            new TextRun({ text: "Page ", size: 16, color: "9CA3AF" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "9CA3AF" }),
            new TextRun({ text: " of ", size: 16, color: "9CA3AF" }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "9CA3AF" })
          ]
        })
      ]})
    },
    children: [

      // ── Title ──────────────────────────────────────────────────────────────
      new Paragraph({
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: "Brand Lens", size: 56, bold: true, color: "111827" })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 80 },
        children: [new TextRun({ text: "End-to-End Testing Guide", size: 36, color: "374151" })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 40 },
        children: [new TextRun({ text: "Gemini Live Agent Challenge — Submission Checklist", size: 22, color: "6B7280", italics: true })]
      }),
      new Paragraph({
        spacing: { before: 0, after: 400 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "1D4ED8" } },
        children: [new TextRun({ text: "Mar 8, 2026  ·  Supabase: foolpmhiedplyftbiocb", size: 18, color: "9CA3AF" })]
      }),

      // ── Prerequisites ──────────────────────────────────────────────────────
      h1("Prerequisites"),
      body("Confirm all of the following before running any tests. A blocked prerequisite will cause everything downstream to fail."),
      gap(80),
      checkbox("GEMINI_API_KEY added to Supabase vault (foolpmhiedplyftbiocb)"),
      checkbox("VITE_GEMINI_API_KEY set in .env (required for voice mode in browser)"),
      checkbox("Edge functions confirmed active — run Section 1 check command"),
      checkbox("App running: npm run dev (local) or deployed to Cloud Run"),
      checkbox("Logged in as demo@brandlens.dev (admin role)"),
      checkbox("At least one brand in the database, OR plan to create one in Section 3"),
      checkbox("Browser DevTools console open — keep visible throughout testing"),
      gap(160),

      // ── Section 1 ──────────────────────────────────────────────────────────
      sectionHeader(1, "Edge Function Verification"),
      gap(100),
      italic("All 19 functions are deployed to the brand-lens Supabase project. Run the command below and confirm the list returns all expected functions. If any are missing, redeploy before continuing."),
      body("Check with:  npx supabase functions list --project-ref foolpmhiedplyftbiocb"),
      gap(100),
      h3("Core Demo Functions — confirm all are listed and active"),
      checkbox("brand-prompt-agent"),
      checkbox("generate-creative-package"),
      checkbox("generate-creative-image"),
      checkbox("generate-creative-video"),
      checkbox("analyze-brand-website"),
      checkbox("analyze-brand-documents"),
      checkbox("analyze-competitor-video"),
      checkbox("synthesize-brand-profile"),
      checkbox("synthesize-generation-prompt"),
      checkbox("generate-brand-guardrails"),
      gap(80),
      h3("Supporting Functions — confirm active"),
      checkbox("generate-brand-starters"),
      checkbox("generate-brand-card-images"),
      checkbox("analyze-brand-images"),
      gap(80),
      notesBox(2),
      gap(200),

      // ── Section 2 ──────────────────────────────────────────────────────────
      sectionHeader(2, "Auth & Navigation"),
      gap(100),

      h2("Test 2.1 — Login"),
      italic("Pass: Redirected to Creative Studio, welcome screen visible."),
      ...stepList([
        "Open the app",
        "Confirm login page shows pre-filled credentials (demo@brandlens.dev)",
        "Click Sign In"
      ]),
      gap(80),
      checkbox("Redirected to Creative Studio after sign-in"),
      checkbox("Welcome screen visible with brand selector"),
      checkbox("No console errors on login"),
      gap(100),
      notesBox(2),
      gap(120),

      h2("Test 2.2 — Navigation and Copy are Clean"),
      italic("Confirm all nav labels, headings, greetings, and placeholder text are consistent with the Brand Lens product identity."),
      ...stepList([
        "Check the nav bar items and page titles",
        "Check Vince's greeting and any default placeholder text",
        "Check footer, about text, or any metadata visible to users"
      ]),
      gap(80),
      checkbox("Nav bar shows Brand Lens, Creative Studio Admin, Vince Control Panel only"),
      checkbox("Vince greeting refers to Brand Lens by name"),
      checkbox("Default brand names, demo data, and placeholder copy are clean"),
      checkbox("No unexpected product names or org names visible anywhere in the UI"),
      gap(100),
      notesBox(2),
      gap(200),

      // ── Section 3 ──────────────────────────────────────────────────────────
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeader(3, "Brand Creation"),
      gap(100),

      h2("Test 3.1 — Create Brand via Vince"),
      italic("Vince calls create_brand and the new brand appears in the brand selector."),
      ...stepList([
        "Open Creative Studio",
        "Open Vince chat panel (bottom of screen)",
        "Type:  Create a new brand called Google with website https://google.com",
        "Wait for response"
      ]),
      gap(80),
      checkbox("Vince responds with confirmation"),
      checkbox("Brand 'Google' appears in brand selector"),
      checkbox("Tool action card visible in chat: create_brand"),
      gap(100),
      notesBox(3),
      gap(200),

      // ── Section 4 ──────────────────────────────────────────────────────────
      sectionHeader(4, "Brand Website Analysis"),
      gap(100),

      h2("Test 4.1 — Analyze Brand Website"),
      italic("Gemini crawls the URL and extracts visual DNA. Takes 15–30 seconds."),
      ...stepList([
        "Select the Google brand",
        "In Vince chat:  Analyze the Google website and extract the brand DNA",
        "Wait for tool completion (15–30 seconds)"
      ]),
      gap(80),
      checkbox("Vince calls analyze_brand_website (tool card visible)"),
      checkbox("Response includes color palette, typography, tone details"),
      checkbox("Brand DNA in Admin → Brands shows populated visual identity"),
      checkbox("No URL hallucination errors in console"),
      gap(100),
      notesBox(3),
      gap(200),

      // ── Section 5 ──────────────────────────────────────────────────────────
      sectionHeader(5, "Document Import"),
      gap(100),

      h2("Test 5.1 — Import Brand PDF"),
      italic("File uploads via paperclip, Vince calls import_brand_document."),
      ...stepList([
        "Have a PDF ready (brand guidelines or any test PDF)",
        "In Vince chat, click the paperclip button and attach the PDF",
        "Type:  Import this brand document and extract the brand intelligence"
      ]),
      gap(80),
      checkbox("File uploads successfully"),
      checkbox("Vince calls import_brand_document tool"),
      checkbox("Response confirms attributes extracted"),
      checkbox("New row in creative_studio_brand_analyses with analysis_type: document"),
      gap(100),
      notesBox(3),
      gap(200),

      // ── Section 6 ──────────────────────────────────────────────────────────
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeader(6, "Brand DNA Synthesis & Playbook"),
      gap(100),

      h2("Test 6.1 — Synthesize Brand Profile"),
      italic("Merges all analysis sources into unified Brand DNA with confidence scoring."),
      ...stepList([
        "After website analysis (and optionally document import)",
        "Say or type:  Synthesize the brand profile"
      ]),
      gap(80),
      checkbox("Vince calls synthesize_brand_profile"),
      checkbox("Response mentions confidence score and updated sections"),
      checkbox("creative_studio_brands — brand_voice and visual_identity columns populated"),
      checkbox("New row in brand_generation_prompts"),
      gap(100),
      notesBox(3),
      gap(120),

      h2("Test 6.2 — Full Brand Playbook"),
      italic("4-step chain: synthesize → 6 directive sets → generation prompt → brand cards. Expect 60–90 seconds."),
      ...stepList([
        "Say or type:  Run the full brand playbook (or: Generate the full brand playbook)",
        "Wait for all steps to complete"
      ]),
      gap(80),
      checkbox("Step 1 completes: Brand DNA synthesis"),
      checkbox("Step 2 completes: All 6 governance directive sets generated"),
      checkbox("Step 3 completes: Generation prompt synthesized"),
      checkbox("Step 4 completes: Brand card images generated"),
      checkbox("Admin → Brands → Google → Directives tab shows 6 directive rows"),
      checkbox("Partial failure handled gracefully (Vince reports which step failed)"),
      gap(100),
      notesBox(4),
      gap(200),

      // ── Section 7 ──────────────────────────────────────────────────────────
      sectionHeader(7, "Creative Package — Interleaved Output"),
      gap(60),
      new Table({
        columnWidths: [FULL_WIDTH],
        rows: [new TableRow({ children: [new TableCell({
          borders: noBorders,
          shading: { fill: "FEF3C7", type: ShadingType.CLEAR },
          children: [new Paragraph({ spacing: { before: 80, after: 80 }, children: [
            new TextRun({ text: "⚡  Hackathon centerpiece. ", bold: true, size: 20, color: "92400E" }),
            new TextRun({ text: "Test this multiple times and record actual latency.", size: 20, color: "92400E" })
          ]})]
        })]})]}),
      gap(100),

      h2("Test 7.1 — Generate Creative Package (Text Chat)"),
      italic("Interleaved output: alternating copy blocks and images in a single API response."),
      ...stepList([
        "Select Google brand (with Brand DNA populated)",
        "In Vince chat:  Create a LinkedIn post campaign for Google's new AI features",
        "Wait for package to render"
      ]),
      gap(80),
      checkbox("Vince calls generate_creative_package (tool action card visible)"),
      checkbox("CreativePackageDisplay renders in chat: alternating copy + images"),
      checkbox("Each deliverable shows copy block THEN image"),
      checkbox("'Use in Canvas' button visible on each image"),
      checkbox("Generation appears in History panel"),
      gap(80),
      new Table({
        columnWidths: [4680, 4680],
        margins: { top: 80, bottom: 80, left: 160, right: 160 },
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: grayBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
              width: { size: 4680, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "First deliverable latency:", size: 20 })] }),
                         new Paragraph({ children: [new TextRun({ text: "___________ seconds", size: 20, bold: true })] })] }),
            new TableCell({ borders: grayBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
              width: { size: 4680, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "Full package (3 deliverables):", size: 20 })] }),
                         new Paragraph({ children: [new TextRun({ text: "___________ seconds", size: 20, bold: true })] })] })
          ]})
        ]
      }),
      gap(100),
      notesBox(3),
      gap(120),

      h2("Test 7.2 — Deliverable Types & Aspect Ratios"),
      ...stepList([
        "Create a product shot with text overlay for Google Search",
        "Create a social story for Google Photos",
        "Create a display banner for Google Workspace"
      ]),
      gap(80),
      checkbox("LinkedIn post renders at 4:3 aspect ratio"),
      checkbox("Product shot with text renders at 1:1"),
      checkbox("Social story renders at 9:16"),
      checkbox("Display banner renders at 16:9"),
      gap(100),
      notesBox(2),
      gap(120),

      h2("Test 7.3 — Use in Canvas"),
      ...stepList([
        "After a creative package renders, click 'Use in Canvas' on any image"
      ]),
      gap(80),
      checkbox("Image loads into the main canvas editor area"),
      checkbox("Toast notification: 'Loaded to canvas'"),
      gap(100),
      notesBox(2),
      gap(200),

      // ── Section 8 ──────────────────────────────────────────────────────────
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeader(8, "Competitive Intelligence"),
      gap(100),

      h2("Test 8.1 — Analyze Competitor Ad (Text Chat)"),
      italic("Critical: Vince must NOT auto-generate a counter-campaign. It must ask first."),
      ...stepList([
        "Find a real YouTube ad URL",
        "In Vince chat:  Analyze this competitor ad: [URL]",
        "Wait for analysis card to appear"
      ]),
      gap(80),
      checkbox("Vince calls analyze_competitor_content"),
      checkbox("Orange 'COMPETITIVE INTEL' card renders in chat"),
      checkbox("Card shows: competitor summary, Strategic Openings list, Counter Brief"),
      checkbox("Vince asks 'Want to build a counter-campaign?' — does NOT auto-generate"),
      gap(100),
      notesBox(3),
      gap(120),

      h2("Test 8.2 — Generate Counter-Campaign"),
      ...stepList([
        "After competitive intel card appears",
        "Reply:  Yes, build the counter-campaign"
      ]),
      gap(80),
      checkbox("Vince calls generate_creative_package with counter brief"),
      checkbox("Creative package renders with deliverables differentiated from competitor"),
      checkbox("Counter brief context visible in copy (not generic AI output)"),
      gap(100),
      notesBox(3),
      gap(200),

      // ── Section 9 ──────────────────────────────────────────────────────────
      sectionHeader(9, "Video Generation — Veo 3"),
      gap(100),

      h2("Test 9.1 — Queue Video (Text Chat)"),
      italic("Fire-and-forget: returns in <3 seconds. Voice session and UI must stay alive while Veo renders."),
      ...stepList([
        "In Vince chat:  Generate a 6-second 16:9 video for Google AI features",
        "Note time when you send the message",
        "Note time when Vince responds"
      ]),
      gap(80),
      checkbox("Vince calls generate_video tool"),
      checkbox("Response returns in under 3 seconds (NOT waiting for render)"),
      checkbox("Elapsed-time counter appears: '● Video rendering / Xs elapsed · appears in History when ready'"),
      checkbox("Counter ticks up every second"),
      checkbox("Dismiss (×) button works without breaking anything"),
      checkbox("After 1–3 min: video appears in History panel automatically"),
      gap(100),
      notesBox(3),
      gap(120),

      h2("Test 9.2 — Fast vs. Quality Model"),
      ...stepList([
        "Generate a fast 4-second 9:16 video for Google Chrome",
        "Generate a quality 8-second video with a reference image URL"
      ]),
      gap(80),
      checkbox("Fast model: queues and returns immediately, no reference image error"),
      checkbox("Quality model: accepts reference image, generates at 8 seconds"),
      gap(100),
      notesBox(2),
      gap(200),

      // ── Section 10 ─────────────────────────────────────────────────────────
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeader(10, "Voice Mode — Gemini Live"),
      gap(60),
      new Table({
        columnWidths: [FULL_WIDTH],
        rows: [new TableRow({ children: [new TableCell({
          borders: noBorders,
          shading: { fill: "EFF6FF", type: ShadingType.CLEAR },
          children: [new Paragraph({ spacing: { before: 80, after: 80 }, children: [
            new TextRun({ text: "Requires VITE_GEMINI_API_KEY in .env.  ", bold: true, size: 20, color: "1D4ED8" }),
            new TextRun({ text: "Always start voice with a manual mic click — never auto-start.", size: 20, color: "1D4ED8" })
          ]})]
        })]})]}),
      gap(100),

      h2("Test 10.1 — Voice Session Start"),
      italic("Mic button starts a live session and the compact inline voice bar appears."),
      ...stepList([
        "Click the microphone button in the Vince header",
        "Grant microphone permission if prompted"
      ]),
      gap(80),
      checkbox("Compact voice bar appears at the bottom of the chat panel"),
      checkbox("Status shows 'Connecting...' briefly, then 'Waiting...'"),
      checkbox("LIVE badge appears in header (red, pulsing)"),
      checkbox("No console errors"),
      gap(100),
      notesBox(2),
      gap(120),

      h2("Test 10.2 — Audio Playback"),
      italic("You must actually hear Vince's voice. Transcripts appearing without audio = AudioContext issue."),
      ...stepList([
        "Start voice (Test 10.1), wait for 'Waiting...'",
        "Say: Hey Vince, who are you?"
      ]),
      gap(80),
      checkbox("5-bar waveform animates emerald/green while Vince speaks"),
      checkbox("You can HEAR Vince's voice through speakers"),
      checkbox("Vince's response transcript appears in the voice bar (white text)"),
      checkbox("When Vince finishes, transcript flushes to chat thread as a message"),
      gap(60),
      italic("If audio is silent but transcripts appear: close and reopen Vince, click mic again. AudioContext requires direct user gesture."),
      gap(100),
      notesBox(2),
      gap(120),

      h2("Test 10.3 — User Speech Display"),
      ...stepList([
        "In voice mode, say slowly: Tell me about this brand's visual identity"
      ]),
      gap(80),
      checkbox("Your words appear in voice bar in cyan italic as you speak"),
      checkbox("Waveform bars shift to cyan while you're speaking"),
      checkbox("Status shows 'Listening...'"),
      checkbox("After you stop, your transcript flushes to chat as a user message"),
      gap(100),
      notesBox(2),
      gap(120),

      h2("Test 10.4 — Barge-In / Interruption"),
      italic("Explicitly judged in Live Agent category: 'Does the agent handle interruptions naturally?'"),
      ...stepList([
        "Ask Vince a question that generates a long response",
        "Interrupt mid-sentence: Actually, never mind — let's talk about something else"
      ]),
      gap(80),
      checkbox("Vince STOPS speaking and responds to the interruption"),
      checkbox("Does NOT finish the previous thought first"),
      checkbox("Conversation continues naturally from the new topic"),
      gap(100),
      notesBox(3),
      gap(120),

      h2("Test 10.5 — Ghost Session (Fast Exit)"),
      italic("Clicking Chat within 1 second of starting must not leave a ghost session with mic running."),
      ...stepList([
        "Click the mic button",
        "Within 1 second (before 'Waiting...' appears), click the Chat button"
      ]),
      gap(80),
      checkbox("Voice bar disappears, text input returns immediately"),
      checkbox("LIVE badge gone from header"),
      checkbox("Browser tab shows no microphone indicator"),
      checkbox("Console shows: [Vince] Voice connection aborted — token mismatch"),
      gap(100),
      notesBox(2),
      gap(120),

      h2("Test 10.6 — Normal Voice Exit"),
      ...stepList([
        "Start voice, wait for 'Waiting...'",
        "Say something, wait for Vince to respond",
        "Click Chat (×)"
      ]),
      gap(80),
      checkbox("Voice bar disappears immediately"),
      checkbox("Text input returns"),
      checkbox("'Voice session ended' pill appears in the chat thread"),
      checkbox("No ghost microphone activity"),
      checkbox("Can immediately type and send a text message"),
      gap(100),
      notesBox(2),
      gap(120),

      h2("Test 10.7 — URL Injection"),
      italic("Paste a URL in the voice bar URL field to send it to the live session."),
      ...stepList([
        "Start voice mode",
        "Click the URL input field (shows: Paste a URL and press Enter...)",
        "Paste a YouTube URL",
        "Press Enter"
      ]),
      gap(80),
      checkbox("Input field clears after pressing Enter"),
      checkbox("Vince's transcript shows it received a URL"),
      checkbox("Vince begins competitor analysis if it's a video URL (see Test 10.9)"),
      gap(100),
      notesBox(2),
      gap(120),

      h2("Test 10.8 — Voice Brand Playbook"),
      italic("Voice-driven brand preparation. All 4 steps narrated by Vince as they complete."),
      ...stepList([
        "In voice mode: Let's get the Google brand ready. Generate the full playbook."
      ]),
      gap(80),
      checkbox("Status bar shows each tool being called"),
      checkbox("Vince narrates progress as each step completes"),
      checkbox("Brand directives visible in Admin after completion"),
      gap(100),
      notesBox(3),
      gap(120),

      h2("Test 10.9 — Voice → Creative Package"),
      italic("The voice-to-interleaved-output pipeline. Core demo moment. Filler speech should fill the wait."),
      ...stepList([
        "In voice mode with brand DNA loaded",
        "Say: Create me a LinkedIn post for Google's new AI features",
        "Listen for filler speech during generation wait"
      ]),
      gap(80),
      checkbox("Status bar shows: ⏳ Generating creative package..."),
      checkbox("Vince speaks filler during the 12–56 second wait"),
      checkbox("CreativePackageDisplay renders in chat panel with copy + images"),
      checkbox("Vince speaks about the results after they appear"),
      gap(80),
      new Table({
        columnWidths: [FULL_WIDTH],
        margins: { top: 80, bottom: 80, left: 160, right: 160 },
        rows: [new TableRow({ children: [new TableCell({
          borders: grayBorders, shading: { fill: "F9FAFB", type: ShadingType.CLEAR },
          width: { size: FULL_WIDTH, type: WidthType.DXA },
          children: [
            new Paragraph({ children: [new TextRun({ text: "Voice → package latency:  ___________ seconds", size: 20, bold: true })] }),
            new Paragraph({ spacing: { before: 60 }, children: [new TextRun({ text: "Filler speech quality (circle):    Natural    Awkward    Too short    Too long", size: 20 })] })
          ]
        })]})]}),
      gap(100),
      notesBox(3),
      gap(120),

      h2("Test 10.10 — Voice Competitor Analysis"),
      ...stepList([
        "In voice mode, say: I want to analyze a competitor ad",
        "Paste a YouTube URL into the voice bar URL field → press Enter"
      ]),
      gap(80),
      checkbox("Status bar shows: ⏳ Analyzing competitor video..."),
      checkbox("Competitive Intel orange card appears in the chat thread"),
      checkbox("Vince verbally summarizes findings"),
      checkbox("Vince asks before building counter-campaign (does NOT auto-generate)"),
      gap(100),
      notesBox(3),
      gap(120),

      h2("Test 10.11 — Voice Video Generation"),
      ...stepList([
        "In voice mode: Generate a 6-second video for Google Search",
        "Continue talking after Vince responds"
      ]),
      gap(80),
      checkbox("Status bar shows: ⏳ Rendering video (1-2 min)..."),
      checkbox("Vince returns quickly — voice session stays alive"),
      checkbox("Vince does not appear frozen or waiting"),
      checkbox("Video appears in History panel within 1–3 minutes"),
      gap(100),
      notesBox(3),
      gap(200),

      // ── Section 11 ─────────────────────────────────────────────────────────
      new Paragraph({ children: [new PageBreak()] }),
      sectionHeader(11, "Director Mode"),
      gap(100),

      h2("Test 11.1 — Quick Starter + Field Population"),
      italic("Starters should populate all 6 structured fields with readable labels, not raw slugs."),
      ...stepList([
        "Switch to Director Mode in Creative Studio",
        "Click any quick starter pill"
      ]),
      gap(80),
      checkbox("6 structured fields populate: Scene, Lighting, Lens, Subject, Camera Movement, Brand Preset"),
      checkbox("Fields show readable labels (e.g. 'Dolly In', 'Rembrandt', 'Portrait 85mm')"),
      checkbox("No raw slugs visible (e.g. 'dolly_in' or 'rembrandt_lighting')"),
      gap(100),
      notesBox(2),
      gap(120),

      h2("Test 11.2 — Generate from Director Mode"),
      ...stepList([
        "Populate fields (via starter or manually)",
        "Click Generate"
      ]),
      gap(80),
      checkbox("Image generates successfully"),
      checkbox("Brand voice injected (brand name/style visible in output)"),
      checkbox("Image appears in History panel"),
      gap(100),
      notesBox(2),
      gap(200),

      // ── Section 12 ─────────────────────────────────────────────────────────
      sectionHeader(12, "History Panel & Real-Time"),
      gap(100),

      h2("Test 12.1 — Real-Time Subscription"),
      ...stepList([
        "Generate any image via Vince chat or Director Mode",
        "Watch the History panel — do NOT refresh"
      ]),
      gap(80),
      checkbox("Generation appears in History panel without page refresh"),
      checkbox("Appears within 2–3 seconds of generation completing"),
      gap(100),
      notesBox(2),
      gap(120),

      h2("Test 12.2 — Creative Package in History"),
      italic("One history entry per package (all image URLs), not one entry per deliverable."),
      ...stepList([
        "Generate a creative package via Vince",
        "Check History panel"
      ]),
      gap(80),
      checkbox("Single History entry with generation_type: creative_package"),
      checkbox("All image URLs visible in one history card"),
      checkbox("NOT multiple entries (one per image)"),
      gap(100),
      notesBox(2),
      gap(200),

      // ── Section 13 ─────────────────────────────────────────────────────────
      sectionHeader(13, "Chrome Extension"),
      gap(100),

      h2("Test 13.1 — Extension Loads"),
      ...stepList([
        "Open Chrome → Extensions (chrome://extensions)",
        "Load unpacked from extension/ directory",
        "Navigate to google.com",
        "Open the extension side panel"
      ]),
      gap(80),
      checkbox("Extension opens without errors"),
      checkbox("Dark theme matching Creative Studio"),
      checkbox("Brand Lens UI visible in side panel"),
      checkbox("Auth works (logged in as demo user)"),
      checkbox("No 'wrong Supabase project' auth errors"),
      gap(100),
      notesBox(3),
      gap(200),

      // ── Demo Day Checklist ─────────────────────────────────────────────────
      new Paragraph({ children: [new PageBreak()] }),
      new Table({
        columnWidths: [FULL_WIDTH],
        rows: [new TableRow({ children: [new TableCell({
          borders: noBorders,
          shading: { fill: "F0FDF4", type: ShadingType.CLEAR },
          children: [new Paragraph({ spacing: { before: 100, after: 100 }, children: [
            new TextRun({ text: "Demo Day — Final Checks", bold: true, size: 32, color: "166534" })
          ]})]
        })]})]}),
      gap(60),
      italic("Run immediately before recording the demo video. Do not skip."),
      gap(100),
      checkbox("Fresh browser profile (no saved session state, no cached dev data)"),
      checkbox("Microphone permissions granted"),
      checkbox("VITE_GEMINI_API_KEY confirmed in .env"),
      checkbox("At least one brand with DNA, directives, and generation prompt fully loaded"),
      checkbox("History panel working — test with one image before recording"),
      checkbox("Voice connection tested — greeting fires cleanly"),
      checkbox("One complete creative package generated successfully"),
      checkbox("Video render confirmed — queued and appeared in History"),
      checkbox("Competitor analysis tested with real URL"),
      checkbox("Barge-in / interruption tested"),
      checkbox("All UI copy, labels, and demo data look clean and product-ready"),
      checkbox("Cloud Run URL (not localhost) if demoing on deployed version"),
      gap(200),

      // ── Test Results Log ───────────────────────────────────────────────────
      h1("Test Results Log"),
      gap(80),
      (() => {
        const hBorder = { style: BorderStyle.SINGLE, size: 1, color: "E5E7EB" };
        const hb = { top: hBorder, bottom: hBorder, left: hBorder, right: hBorder };
        const header = new TableRow({ tableHeader: true, children: [
          new TableCell({ borders: hb, shading: { fill: "1D4ED8", type: ShadingType.CLEAR },
            width: { size: 720, type: WidthType.DXA },
            children: [new Paragraph({ alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "#", bold: true, size: 18, color: "FFFFFF" })] })] }),
          new TableCell({ borders: hb, shading: { fill: "1D4ED8", type: ShadingType.CLEAR },
            width: { size: 4320, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "Test", bold: true, size: 18, color: "FFFFFF" })] })] }),
          new TableCell({ borders: hb, shading: { fill: "1D4ED8", type: ShadingType.CLEAR },
            width: { size: 1080, type: WidthType.DXA },
            children: [new Paragraph({ alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Pass", bold: true, size: 18, color: "FFFFFF" })] })] }),
          new TableCell({ borders: hb, shading: { fill: "1D4ED8", type: ShadingType.CLEAR },
            width: { size: 3240, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: "Notes", bold: true, size: 18, color: "FFFFFF" })] })] }),
        ]});
        return new Table({
          columnWidths: [720, 4320, 1080, 3240],
          margins: { top: 80, bottom: 80, left: 160, right: 160 },
          rows: [
            header,
            resultRow("1", "Edge functions deployed"),
            resultRow("2.1", "Login"),
            resultRow("2.2", "Navigation clean"),
            resultRow("3.1", "Create brand"),
            resultRow("4.1", "Website analysis"),
            resultRow("5.1", "Document import"),
            resultRow("6.1", "Brand synthesis"),
            resultRow("6.2", "Brand playbook (4 steps)"),
            resultRow("7.1", "Creative package — interleaved output"),
            resultRow("7.2", "Deliverable types / aspect ratios"),
            resultRow("7.3", "Use in Canvas button"),
            resultRow("8.1", "Competitive intel card"),
            resultRow("8.2", "Counter-campaign generation"),
            resultRow("9.1", "Video queue — fire-and-forget"),
            resultRow("9.2", "Fast vs. quality model"),
            resultRow("10.1", "Voice session start"),
            resultRow("10.2", "Audio playback"),
            resultRow("10.3", "User speech display"),
            resultRow("10.4", "Barge-in / interruption"),
            resultRow("10.5", "Ghost session (fast exit)"),
            resultRow("10.6", "Normal voice exit"),
            resultRow("10.7", "URL injection"),
            resultRow("10.8", "Voice brand playbook"),
            resultRow("10.9", "Voice → creative package"),
            resultRow("10.10", "Voice competitor analysis"),
            resultRow("10.11", "Voice video generation"),
            resultRow("11.1", "Director mode starters"),
            resultRow("12.1", "Real-time History"),
            resultRow("13.1", "Chrome extension"),
          ]
        });
      })(),

      gap(200),
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" } },
        spacing: { before: 160, after: 0 },
        children: [
          new TextRun({ text: "Brand Lens  ·  Gemini Live Agent Challenge  ·  Deadline Mar 16, 2026", size: 16, color: "9CA3AF", italics: true })
        ]
      })

    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/Users/klmiller/Documents/GitHub/brand-lens/docs/brand-lens-testing-guide.docx', buf);
  console.log('Done → brand-lens-testing-guide.docx');
});
