// ABOUTME: Pure functions that translate vendor/product compliance data into plain-language guidance
// ABOUTME: Shared by MergeGuidelines component and AIGuidelinesDialog for consistent compliance messaging

import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ClipboardCheck,
} from 'lucide-react';

export interface ComplianceGuidance {
  allowed: boolean | 'conditional';
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  text: string;
  detail: string;
}

export interface OwnershipGuidance {
  safe: boolean | 'conditional';
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  text: string;
  detail: string;
}

export interface ApprovalGuidance {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  text: string;
  requirements: string[];
}

/**
 * Resolves effective compliance values by preferring product-level overrides
 * over vendor-level defaults (NULL = inherit from vendor).
 */
export function resolveEffectiveCompliance(
  vendor: {
    access_tier: string | null;
    output_ownership_rights: string | null;
    client_approval_required: boolean;
    training_opt_out: string | null;
    privacy_tier: string | null;
  },
  product?: {
    access_tier?: string | null;
    output_ownership_rights?: string | null;
    client_approval_required?: boolean | null;
    training_opt_out?: string | null;
    privacy_tier?: string | null;
  } | null,
) {
  return {
    accessTier: product?.access_tier || vendor.access_tier,
    outputOwnershipRights: product?.output_ownership_rights || vendor.output_ownership_rights,
    clientApprovalRequired: product?.client_approval_required ?? vendor.client_approval_required,
    trainingOptOut: product?.training_opt_out || vendor.training_opt_out,
    privacyTier: product?.privacy_tier || vendor.privacy_tier,
  };
}

export function getInternalUsageGuidance(accessTier: string | null, _clientApprovalRequired?: boolean): ComplianceGuidance {
  const tier = accessTier || '';

  if (tier.includes('Tier 1') || tier.includes('Green')) {
    return {
      allowed: true,
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      text: 'Yes - approved for all MERGE employees',
      detail: 'This tool is fully approved for internal work. Use it freely for ideation, research, drafts, and internal projects.',
    };
  } else if (tier.includes('Tier 2') || tier.includes('Amber')) {
    return {
      allowed: true,
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      text: 'Yes - with manager approval',
      detail: 'Get approval from your manager before using. Once approved, use for internal work only unless client approval is also obtained.',
    };
  } else if (tier.includes('Tier 3') || tier.includes('Red')) {
    return {
      allowed: false,
      icon: XCircle,
      iconColor: 'text-red-600',
      text: 'Restricted - special approval required',
      detail: 'This tool requires legal and compliance review before use. Contact the AI Garage team if you have a business case.',
    };
  }

  return {
    allowed: false,
    icon: AlertTriangle,
    iconColor: 'text-gray-600',
    text: 'Pending review - check with AI Garage',
    detail: 'This tool is under review. Contact the AI Garage for current status and guidance.',
  };
}

export function getClientWorkGuidance(accessTier: string | null, clientApprovalRequired: boolean): ComplianceGuidance {
  const tier = accessTier || '';

  if (clientApprovalRequired || tier.includes('Tier 3') || tier.includes('Red')) {
    return {
      allowed: false,
      icon: XCircle,
      iconColor: 'text-red-600',
      text: 'No - not approved for client deliverables',
      detail: 'Do not use this tool for any client-facing work or paid deliverables. Client approval and legal review required.',
    };
  } else if (tier.includes('Tier 2') || tier.includes('Amber')) {
    return {
      allowed: 'conditional',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      text: 'Case-by-case - requires account lead approval',
      detail: 'May be used for client work with explicit approval from your account lead. Document approval before proceeding.',
    };
  } else if (tier.includes('Tier 1') || tier.includes('Green')) {
    return {
      allowed: true,
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      text: 'Yes - approved for client projects',
      detail: 'This tool is approved for client deliverables. Follow standard quality review processes for all client work.',
    };
  }

  return {
    allowed: false,
    icon: AlertTriangle,
    iconColor: 'text-gray-600',
    text: 'Check with your account lead first',
    detail: 'Guidance pending - consult your account lead and the AI Garage team before using for client work.',
  };
}

export function getOwnershipGuidance(outputOwnershipRights: string | null): OwnershipGuidance {
  const ownership = outputOwnershipRights || '';

  if (ownership.includes('Client Owns') || ownership.includes('User Owns')) {
    return {
      safe: true,
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      text: 'You and the client own what you create',
      detail: 'All outputs generated are owned by you/MERGE and your clients. Safe for client deliverables.',
    };
  } else if (ownership.includes('Vendor Retains Rights')) {
    return {
      safe: false,
      icon: XCircle,
      iconColor: 'text-red-600',
      text: 'Vendor retains some rights to outputs',
      detail: 'The vendor may retain certain rights to what you create. Avoid using for proprietary client work without legal review.',
    };
  } else if (ownership.includes('Shared')) {
    return {
      safe: false,
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      text: 'Shared ownership with vendor',
      detail: 'Both you and the vendor have rights to outputs. Use caution with confidential or proprietary work.',
    };
  }

  return {
    safe: false,
    icon: AlertTriangle,
    iconColor: 'text-gray-600',
    text: 'Ownership terms unclear',
    detail: 'Review vendor terms carefully or consult legal before using for important work.',
  };
}

export function getDataGuidance(trainingOptOut: string | null, privacyTier: string | null): OwnershipGuidance {
  const optOut = trainingOptOut || '';
  const privacy = privacyTier || '';

  const canOptOut = optOut.toLowerCase().includes('yes') ||
                    optOut.toLowerCase().includes('available');

  if (canOptOut && (privacy.includes('Tier 1') || privacy.toLowerCase().includes('high'))) {
    return {
      safe: true,
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      text: 'Can use with client data (training opt-out enabled)',
      detail: 'This tool allows you to opt out of AI training. Client data can be used with proper opt-out settings configured.',
    };
  } else if (canOptOut) {
    return {
      safe: 'conditional',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      text: 'Internal data only (with training opt-out)',
      detail: 'Configure training opt-out settings. Use only internal/public data - avoid client PII or confidential information.',
    };
  } else {
    return {
      safe: false,
      icon: XCircle,
      iconColor: 'text-red-600',
      text: 'Public data only - no client or confidential info',
      detail: 'Do NOT upload client data, PII, or confidential information. Vendor may use your inputs for AI training.',
    };
  }
}

export function getApprovalGuidance(accessTier: string | null, clientApprovalRequired: boolean): ApprovalGuidance {
  const tier = accessTier || '';
  const requirements: string[] = [];

  if (tier.includes('Tier 2') || tier.includes('Amber')) {
    requirements.push('Manager approval for internal use');
  }
  if (tier.includes('Tier 3') || tier.includes('Red')) {
    requirements.push('Legal and compliance review required');
  }
  if (clientApprovalRequired) {
    requirements.push('Client approval before use on their projects');
  }
  if (tier.includes('Tier 2') || tier.includes('Amber')) {
    requirements.push('Account lead approval for client work');
  }

  if (requirements.length === 0) {
    return {
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      text: 'No special approval needed',
      requirements: ['Use freely following standard MERGE processes'],
    };
  }

  return {
    icon: ClipboardCheck,
    iconColor: 'text-blue-600',
    text: 'Approval required',
    requirements,
  };
}
