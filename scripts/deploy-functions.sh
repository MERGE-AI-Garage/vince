#!/bin/bash
# ABOUTME: Deploys all Supabase edge functions with --no-verify-jwt.
# ABOUTME: ALL functions in this project require this flag — never deploy without it.

set -e

FUNCTIONS=(
  brand-prompt-agent
  analyze-brand-website
  synthesize-brand-profile
  generate-creative-package
  analyze-competitor-video
  generate-creative-video
  analyze-brand-documents
  generate-brand-guardrails
  analyze-brand-images
  enhance-director-prompt
  analyze-expansion-direction
  generate-brand-prompt
  generate-creative-image
  generate-brand-starters
  synthesize-generation-prompt
  generate-brand-card-images
  generate-header-image
  generate-studio-welcome-images
)

for fn in "${FUNCTIONS[@]}"; do
  echo "Deploying $fn..."
  npx supabase functions deploy "$fn" --no-verify-jwt
done

echo ""
echo "All ${#FUNCTIONS[@]} functions deployed."
