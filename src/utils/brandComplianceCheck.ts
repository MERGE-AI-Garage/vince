// ABOUTME: Checks a prompt against brand directive forbidden_combinations before image generation
// ABOUTME: Returns violations as warnings to show the user before they commit to generating

export interface ComplianceViolation {
  directive: string;
  matched: [string, string];
  severity: 'error' | 'warning';
}

export interface ComplianceResult {
  passed: boolean;
  violations: ComplianceViolation[];
}

interface DirectiveRow {
  name: string;
  forbidden_combinations?: unknown;
  rules?: unknown;
}

/**
 * Fast keyword-based check of a prompt against brand directives.
 * Checks forbidden_combinations: if both items in a pair appear in the prompt, it's a violation.
 */
export function checkPromptCompliance(
  prompt: string,
  directives: DirectiveRow[]
): ComplianceResult {
  if (!prompt || !directives?.length) {
    return { passed: true, violations: [] };
  }

  const lowerPrompt = prompt.toLowerCase();
  const violations: ComplianceViolation[] = [];

  for (const directive of directives) {
    const forbidden = directive.forbidden_combinations;
    if (!Array.isArray(forbidden)) continue;

    for (const combo of forbidden) {
      // Support both array-of-strings format (our DB) and object format
      const items: string[] = Array.isArray(combo)
        ? combo.map(String)
        : combo?.items
          ? (combo.items as string[])
          : [];

      if (items.length < 2) continue;

      // Check if both items in the pair appear in the prompt
      const matched = items.filter(item =>
        lowerPrompt.includes(item.toLowerCase())
      );

      if (matched.length >= 2) {
        violations.push({
          directive: directive.name,
          matched: [matched[0], matched[1]] as [string, string],
          severity: 'warning',
        });
      }
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}
