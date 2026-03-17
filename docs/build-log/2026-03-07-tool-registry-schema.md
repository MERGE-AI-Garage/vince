# Tool Registry — Schema & Demo Data

## What This Is

The Tool Registry powers the AI Guidelines feature in Vince — it lets brands define which AI tools are approved, restricted, or off-limits for their work. This doc covers the schema decisions, migrations applied, and the 13 seeded demo tools.

## Schema

### Tables

**`categories`** (renamed from `product_categories`)
- `id`, `name`, `slug`, `icon`, `color_scheme`
- Rename was required: PostgREST relational join syntax requires the alias in `.select()` to match the actual table name. `categories(...)` in a query fails if the table is named `product_categories`.

**`vendors`** (new)
- `id`, `name`, `slug`, `website`
- Compliance columns: `access_tier`, `risk_score`, `indemnification_level`, `compliance_certifications`, `privacy_tier`, `training_opt_out`, `brand_safety_controls`, `output_ownership_rights`, `client_approval_required`
- Seeded: Google LLC, Adobe Inc., Canva Pty Ltd

**`products`** (AI tools)
- Core: `id`, `name`, `slug`, `description`, `category_id`, `vendor_id`, `logo_url`, `display_order`, `is_active`
- Compliance columns added: `commercial_safety`, `approved_workflow_stage`, `access_tier`, `output_restrictions`, `indemnification_level`, `legal_class`, `risk_score`, `privacy_tier`, `input_data_policy`, `training_opt_out`, `data_residency`, `output_ownership_rights`, `client_approval_required`, `brand_safety_controls`

**`brand_tool_approvals`**
- `id`, `brand_id` (FK → creative_studio_brands), `product_id` (FK → products)
- `approval_status`: `'approved' | 'restricted' | 'not_approved' | 'pending'`
- `usage_scope`: `'client_deliverables' | 'internal_concepting' | 'internal_only' | 'not_allowed'`
- `notes` text (optional)
- Unique constraint on `(brand_id, product_id)`
- Previous schema had `tool_name` text, `status`, `approved_by` — all removed

### PostgREST Join Rule
The join alias in `.select()` must exactly match the table name. This was the root cause of the `categories` rename — `useProducts.ts` used `categories(...)` in its select, which requires a table literally named `categories`.

## Demo Tools (13)

### Google AI
| Tool | Vendor | Logo Domain |
|------|--------|-------------|
| Gemini Advanced | Google LLC | google.com |
| Google AI Studio | Google LLC | google.com |
| NotebookLM | Google LLC | google.com |
| Google Workspace AI | Google LLC | google.com |

### Creative & Design
| Tool | Vendor | Logo Domain |
|------|--------|-------------|
| Adobe Firefly | Adobe Inc. | adobe.com |
| Canva AI | Canva Pty Ltd | canva.com |
| Adobe Photoshop AI | Adobe Inc. | adobe.com |

### Video & Media
| Tool | Vendor | Logo Domain |
|------|--------|-------------|
| Veo 3 | Google LLC | google.com |
| Imagen 4 | Google LLC | google.com |
| Google Video Studio | Google LLC | google.com |
| Google Slides AI | Google LLC | google.com |
| Google Docs AI | Google LLC | google.com |
| Google Sheets AI | Google LLC | google.com |

### Logo URLs
All logos sourced from logo.dev:
```
https://img.logo.dev/{domain}?token=pk_A3Bkx6TVQFe-hiiUFnETYg&format=png
```

## Compliance Data Defaults (seeded)

All tools were seeded with representative compliance data:
- Google AI tools: `access_tier = 'Tier 1: Green'`, `risk_score = 'Low'`, `training_opt_out = 'Yes - Opted Out by Default'`
- Adobe tools: `access_tier = 'Tier 2: Amber'`, `risk_score = 'Medium'`
- Canva: `access_tier = 'Tier 2: Amber'`, `risk_score = 'Medium'`
- `approved_workflow_stage` uses `'Agency Marketing'`

## Migrations Applied (in order)

1. `rename_product_categories_to_categories` — `ALTER TABLE product_categories RENAME TO categories`
2. `vendors_and_fix_brand_tool_approvals` — created vendors table, fixed brand_tool_approvals schema, seeded vendors, linked products
3. `products_compliance_columns_and_logos` — added 14 compliance columns, set logo_url for all 13 tools, set compliance data
4. `update_product_names_veo3_imagen4` — renamed "Veo 2" → "Veo 3", "Imagen 3" → "Imagen 4"
5. `update_approved_workflow_stage_values` — set `approved_workflow_stage` to `'Agency Marketing'` across all tools
