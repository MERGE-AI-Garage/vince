# Getting Started with Vince

Welcome! This guide walks you through creating your first piece of AI-generated creative — from logging in to downloading a finished image.

## What You'll Learn
- How to log in
- How to choose a brand
- How to write your first prompt and generate an image
- How to download your result

**Time Required:** 5 minutes

---

## Step 1: Log In

1. Go to your Vince URL (ask your admin if you don't have it)
2. Enter your email address and password
3. Click **Sign In**

<ScreenshotCard title="Login" route="/login" imagePath="/visual-manual/screenshots/01-login.png" />

**What You Should See:**
The Creative Studio opens with a large canvas area in the center and a brand selector across the top.

**❌ Can't log in?**
- Double-check your email address — typos are the most common cause
- Use **Forgot password** if you haven't logged in before
- Contact your admin if your account hasn't been created yet

---

## Step 2: Choose a Brand

Every generation in Vince is tied to a brand. The brand gives Vince its creative direction — colors, tone, photography style, and visual identity.

1. Look at the **top bar** of the screen
2. Click the brand name or the brand selector dropdown
3. Choose the brand you want to work with

<ScreenshotCard title="Creative Studio" route="/" imagePath="/visual-manual/screenshots/02-homepage.png" />

**What You Should See:**
The canvas background and accent colors update to match the brand you selected. The welcome screen shows that brand's quick prompts and guidelines.

> **CONFIRMED** — `src/components/creative-studio/BrandShopTopBar.tsx`; `src/components/creative-studio/WelcomeScreen.tsx`

---

## Step 3: Write a Prompt

The prompt bar is at the **bottom of the screen**. This is where you describe what you want to create.

1. Click inside the prompt bar
2. Type a description of what you want — for example:
   - *"Product shot on a white marble surface, natural light, lifestyle feel"*
   - *"Bold social post for a summer campaign, warm tones, energetic"*
3. Make sure the mode selector shows **Image** (the default)

<ScreenshotCard title="Studio — Prompt Bar" route="/studio" imagePath="/visual-manual/screenshots/03-studio.png" />

**Tips for good prompts:**
- Be specific about mood, lighting, and composition
- Mention the format if it matters (square, portrait, widescreen)
- Reference the brand name if you want Vince to emphasize brand colors or style

> **CONFIRMED** — `src/components/creative-studio/BrandShopPromptBar.tsx`

---

## Step 4: Generate

1. Press **Enter** or click the **Generate** button (arrow icon)
2. Watch the canvas — you'll see a loading indicator while Vince works


**What You Should See:**
Your image appears on the canvas. The left sidebar (History) also adds a thumbnail of your new generation.

**Generation usually takes 10–30 seconds** for images. Video takes longer — see [Generation Workflows](02-generation-workflows.md) for details.

> **CONFIRMED** — `src/components/creative-studio/EditorCanvas.tsx`; `src/components/creative-studio/HistoryPanel.tsx`

---

## Step 5: Review Your Result

Once generated, your image fills the canvas.

1. Look at the result — does it match what you had in mind?
2. If you want to tweak it, edit the prompt and generate again
3. If you're happy with it, move on to download


**Not what you expected?**
- Try adding more detail to your prompt
- Switch to a different generation mode (see [Generation Workflows](02-generation-workflows.md))
- Use a prompt template to guide Vince — see [Prompt Templates](03-prompt-templates.md)

---

## Step 6: Download Your Image

1. Hover over the image on the canvas
2. Click the **Download** icon that appears
3. Your image saves to your computer's Downloads folder


**Your image is ready to use!** 🎉

> **CONFIRMED** — `src/components/creative-studio/EditorCanvas.tsx`

---

## What's in the History Sidebar?

The left sidebar keeps every image you've generated in this session and in past sessions. Click any thumbnail to bring it back to the canvas.

<ScreenshotCard title="Generation History" route="/studio" imagePath="/visual-manual/screenshots/14-admin-tab-generations.png" />

> **CONFIRMED** — `src/components/creative-studio/HistoryPanel.tsx`

---

## Next Steps

- Learn all the ways to generate creative: [Generation Workflows](02-generation-workflows.md)
- Speed up your work with pre-built prompts: [Prompt Templates](03-prompt-templates.md)
- Organize your assets: [Media Management](04-media-management.md)
- Something not working? [Troubleshooting](05-troubleshooting.md)
