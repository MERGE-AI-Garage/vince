# UI Copy Standards

## Overview

Vince uses neutral, product-agnostic copy throughout. These are the conventions enforced across all source files and edge functions.

## Conventions

- No organization names in user-facing strings, placeholders, or example text
- Placeholder brand examples use well-known neutral brands: Nike, Apple, Patagonia
- Placeholder approval notes use: `"e.g. Approved for all client work"`
- `approved_workflow_stage` DB values use `'Agency Marketing'`
- User-Agent strings use `BrandLens-*` prefix (`BrandLens-Bot/1.0`, `BrandLens-Analyzer/1.0`)
- Compliance guidance refers to "team members" generically

## File Reference

### `src/lib/complianceGuidance.ts`
- Approval strings: `'Yes - approved for all team members'`
- Ownership strings: `'owned by you and your clients'`
- Process strings: `'Use freely following standard approval processes'`

### `src/components/creative-studio/BrandEditorDialog.tsx`
- Brand name placeholder: `"e.g. Nike, Patagonia, Apple"`

### `src/components/creative-studio/BrandIntelligenceTab.tsx`
- Tool approval note placeholder: `"e.g. Approved for all client work"`

### `src/hooks/useProducts.ts`
- `approved_workflow_stage` type union: `'Agency Marketing'`

### `supabase/functions/_shared/content-scraper.ts`
- User-Agent: `BrandLens-Bot/1.0`

### `supabase/functions/analyze-brand-website/index.ts`
- User-Agent: `BrandLens-Analyzer/1.0`
- Gemini prompt examples use neutral brand names

### `src/components/creative-studio/AIGuidelinesDialog.tsx`
- No hardcoded logo or brand identity in the dialog header — uses the selected brand's assets
- See `2026-03-07-ai-guidelines-dialog-brand-header.md` for header design
