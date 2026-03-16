# Media Management

The Media Library is where you store, organize, and reuse images, videos, and other files across your Vince work.

---

## Opening the Media Library

- **Web app:** Click the **Media** tab or the media icon in the sidebar
- **Extension:** Click the **Media** tab in the side panel
- **Mobile:** Tap the **Media** tab in the bottom navigation

<ScreenshotCard title="Media Library" route="/admin" imagePath="/visual-manual/screenshots/15-admin-tab-media.png" />

> **CONFIRMED** — `src/components/creative-studio/MediaLibraryPanel.tsx`; `src/components/creative-studio/MediaLibraryTab.tsx`; extension and mobile tabs confirmed in `extension/src/BrandApp.tsx` and `mobile/src/MobileApp.tsx`

---

## How to Upload Files

### Uploading from the Media Library

1. Open the Media Library
2. Click the **Upload** button
3. Drag and drop your files into the upload area, or click to browse
4. Choose a folder to organize the files (optional)
5. Add tags if you'd like to find them easily later
6. Click **Upload**



> **CONFIRMED** — `src/components/creative-studio/MediaUploadDialog.tsx`

### Uploading While Generating

You can also upload a reference image directly from the canvas area:

1. In the canvas, look for the **upload** or **drag image here** area
2. Drag an image from your computer onto the canvas
3. The image loads as an input for editing, product recontext, or try-on

> **CONFIRMED** — `src/components/creative-studio/EditorCanvas.tsx` (drag-drop and upload)

---

## File Types Supported

The Media Library stores:

| Type | Examples |
|------|---------|
| **Images** | JPG, PNG, WebP, and other common formats |
| **Videos** | Generated videos and uploaded clips |
| **Audio** | Audio files |
| **Documents** | Other uploaded files |

> **CONFIRMED** — `file_type` field in `src/types/media.ts`

---

## How to Organize with Folders

Folders help you keep your assets tidy — by campaign, client, season, or any structure that makes sense for your team.

**Create a folder:**
1. In the Media Library, click **New Folder** (or the folder-plus icon)
2. Give it a name
3. Choose a color and icon (optional) to make it easy to spot

**Move files to a folder:**
1. Select one or more files (click to select, or use the checkbox)
2. Use the **Move** action
3. Choose the destination folder



> **CONFIRMED** — folder hierarchy with color and icon fields in `src/types/media.ts`; `src/components/media/MediaBreadcrumbs.tsx`

---

## How to Search and Filter

The Media Library has a search bar and filters to quickly find what you're looking for.

**Search:** Type keywords that match file names, tags, or detected objects.

**Filter options:**
- **File type** — images only, videos only, etc.
- **Tags** — filter by any tag you or Vince have applied
- **Date range** — files uploaded or created within a time window
- **File size** — to find large files taking up space



> **CONFIRMED** — filter fields on media types in `src/types/media.ts`

---

## Tags and Metadata

Every file in the Media Library has metadata you can view and edit.

**Auto-tags:** Vince automatically identifies what's in your images — objects, subjects, styles — and applies tags so you can search for them later.

**Custom tags:** You can add your own tags to organize files your way.

**How to tag a file:**
1. Click on a file to open its detail view
2. Click **Edit Tags** or the tag icon
3. Add or remove tags
4. Save



> **CONFIRMED** — `src/components/media/MediaTagDialog.tsx`; `auto_tags`, `detected_objects`, `custom_metadata` fields in `src/types/media.ts`

---

## How to Share a File

You can share individual files from the Media Library with a link.

1. Select a file
2. Click **Share**
3. Set options:
   - **Password protection** — require a password to access the link
   - **Expiry date** — link stops working after a set date
   - **Download permission** — allow or block downloading
4. Copy the share link and send it



> **CONFIRMED** — sharing fields (`share_token`, `share_expiry`, `share_password`, `allow_download`) in `src/types/media.ts`

---

## How to Delete Files

⚠️ **Before deleting:** Check if the file is being used as a reference in any templates or generations. Deleting a file that's referenced elsewhere may affect those assets.

**To delete a file:**
1. Select the file (or files) you want to remove
2. Click **Delete**
3. Confirm when prompted

**Good news:** Files are moved to a "deleted" state first — your admin may be able to recover them if you made a mistake. Ask your admin about your organization's recovery window.

> **CONFIRMED** — soft delete via `deleted_at` field in `src/types/media.ts`

---

## Activity Log

Every action on a file is tracked: who uploaded it, when it was tagged, if it was moved, and who deleted it.

If you need to find out what happened to a file, ask your admin to check the activity log.

> **CONFIRMED** — `MediaActivityLog` type with action types (upload, edit, move, tag, delete, share) in `src/types/media.ts`

---

## Tips for Staying Organized

- **Create folders before uploading** — it's easier to assign a folder during upload than to sort files later
- **Use consistent tag names** — decide on naming conventions with your team (e.g., "Q1-2025" vs "q1 2025")
- **Clean up regularly** — delete temporary or test files so the library stays useful
- **Use Collections** (saved searches) for files you access often — this is a pre-filtered view you can return to quickly

> **CONFIRMED** — `MediaCollection` type with filter criteria in `src/types/media.ts`
