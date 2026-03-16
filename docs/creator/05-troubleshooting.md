# Troubleshooting Guide

Having problems? Find your issue below.

---

## "I can't log in"

**Symptom:** You see an error after entering your email and password, or the page just reloads without logging you in.

**Solutions:**
1. **Check your email address** — Make sure there are no typos. The most common login issue is a small error in the email.
2. **Check your password** — Passwords are case-sensitive. Try typing it in a text editor first to confirm it's right, then paste it.
3. **Use the reset option** — If you're not sure of your password, use the **Forgot Password** link on the login screen.
4. **Contact your admin** — If your account was recently created, your admin may need to confirm it's active.

> **CONFIRMED** — `src/pages/Login.tsx`; Supabase authentication via `src/integrations/supabase/client.ts`

---

## "My generation failed or shows an error"

**Symptom:** You click Generate and see an error message instead of an image, or the loading spinner runs for a very long time then fails.

**Solutions:**
1. **Try again** — Temporary connection issues can cause a single failure. Click Generate a second time.
2. **Shorten your prompt** — Extremely long prompts can sometimes cause issues. Try a shorter, cleaner description.
3. **Check your quota** — If you've used up your weekly image or video allowance, generations will fail. See "I've run out of generations" below.
4. **Try a different mode** — If one generation mode is having issues, switch to a different mode and try a simple test prompt to see if the problem is isolated.
5. **Refresh the page** — A stale browser session can sometimes cause generation errors. Reload and try again.

> **CONFIRMED** — `status` field (pending/processing/completed/failed) on `CreativeStudioGeneration` in `src/types/creative-studio.ts`

---

## "I've run out of generations"

**Symptom:** You see a message saying your quota is used up, or a notice with a reset date.

**What this means:** Vince gives each user a weekly allowance of image and video generations. When you reach the limit, you'll need to wait for the quota to reset, or ask your admin to increase your limit.

**Solutions:**
1. **Check the quota display** — Look for the quota indicator (usually in the prompt bar area or top bar). It shows how many generations you have left and when the quota resets.
2. **Wait for the reset** — Quotas reset weekly. The reset day is shown in the quota display.
3. **Ask your admin** — Your admin can raise your limit or grant you unlimited access if needed.



> **CONFIRMED** — `src/components/creative-studio/QuotaDisplay.tsx`; `CreativeStudioUserQuota` type in `src/types/creative-studio.ts`; `QuotaErrorResponse` type showing reset date

---

## "My image doesn't look right"

**Symptom:** The image generated doesn't match what you described, or the quality is poor.

**Solutions:**
1. **Add more detail to your prompt** — Vague prompts produce unpredictable results. Describe the mood, lighting, composition, and subject clearly.
2. **Use a prompt template** — The [Prompt Templates](03-prompt-templates.md) library has pre-built prompts that are optimized for common use cases.
3. **Check your brand selection** — Make sure you have the right brand selected. Brand affects visual DNA, colors, and style.
4. **Adjust parameters** — Open the **Parameters** panel on the right. Try changing the aspect ratio, or try a different model if multiple are available.
5. **Use camera controls** — For photography-style images, open Camera Controls to specify lighting, focal length, and composition.
6. **Use Conversational Edit** — Generate a starting image, then refine it through dialogue. See [Generation Workflows](02-generation-workflows.md).

---

## "The voice interface isn't working"

**Symptom:** You click the Vince Agent button and the microphone doesn't activate, you can't hear responses, or the voice interface freezes.

**Solutions:**
1. **Allow microphone access** — Your browser will ask for permission the first time. If you accidentally denied it:
   - Click the lock icon or camera icon in your browser's address bar
   - Find "Microphone" and change it to "Allow"
   - Reload the page and try again
2. **Check your microphone is connected** — Make sure your mic or headset is plugged in and selected as the default input in your system settings.
3. **Use chat instead** — If voice isn't working, the voice interface also has a text input. Type your brief instead of speaking.
4. **Reload the page** — Sometimes the voice connection drops. Refresh and reopen the agent.



> **CONFIRMED** — `src/components/creative-studio/BrandAgentApp.tsx`; `src/components/creative-studio/VoiceOverlay.tsx`

---

## "I can't find an image I generated earlier"

**Symptom:** You generated something and now you can't find it in the History panel, or it seems to have disappeared.

**Solutions:**
1. **Check the History panel** — The left sidebar shows your recent generations. Scroll down to find older ones.
2. **Check the Campaigns tab** — If the image was part of a campaign package, find it in the Campaigns archive.
3. **Check the Media Library** — If the image was saved to your media library, look there.
4. **Contact your admin** — If you still can't find it, your admin may be able to search the full generation log.

> **CONFIRMED** — `src/components/creative-studio/HistoryPanel.tsx`; `src/components/creative-studio/CampaignsTab.tsx`

---

## "My file won't upload to the Media Library"

**Symptom:** You try to upload a file and it fails, or sits at 0% forever.

**Solutions:**
1. **Check your internet connection** — A slow or interrupted connection will cause uploads to stall.
2. **Try a smaller file** — Very large files can time out. If possible, compress or resize the image first.
3. **Try a different browser** — Occasionally browser extensions or settings interfere with uploads. Try Chrome or Edge if you're using Firefox, or vice versa.
4. **Reload and try again** — Refresh the page and attempt the upload a second time.

---

## "The page seems frozen or stopped responding"

**Symptom:** Buttons don't respond, the canvas won't load, or the page feels stuck.

**Solutions:**
1. **Reload the page** — Press `Ctrl+R` (Windows/Linux) or `Cmd+R` (Mac). Your history and session are saved — you won't lose your work.
2. **Close extra tabs** — Many open tabs can slow down your browser significantly.
3. **Clear your browser's stored data** — Go to your browser settings and clear the stored site data for the Vince app. Then reload.
4. **Try a different browser** — If the issue persists, try opening Vince in a different browser.

---

## "I accidentally deleted something"

**Symptom:** You deleted a file from the Media Library or a campaign and want it back.

**Solutions:**
1. **Contact your admin immediately** — Files are not permanently removed right away. Your admin may be able to recover a recently deleted file.
2. **For generated images** — If you deleted from the Media Library, your admin can check. If you're just looking for a past generation, check the History panel or Campaigns tab.

> **CONFIRMED** — soft delete via `deleted_at` in `src/types/media.ts`

---

## "I need help with something not listed here"

**Contact your admin** with:
- What you were trying to do
- What happened instead
- A screenshot if possible
- The time it happened (helps with log searches)

Your admin can also check the **Audit Trail** to see exactly what occurred and when.

> **CONFIRMED** — `AuditLogEntry` type in `src/types/creative-studio.ts`; `CreativeStudioAdmin` audit trail view
