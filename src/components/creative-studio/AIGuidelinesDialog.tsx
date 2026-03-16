// ABOUTME: AI tool guidelines dialog for Brand Shop — shows per-brand tool approvals with compliance details
// ABOUTME: Branded header, tool-by-tool breakdown using shared compliance guidance functions

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  FileText,
  Eye,
  Scale,
} from 'lucide-react';
import { useBrandToolApprovals, type BrandToolApproval } from '@/hooks/useBrandToolApprovals';
import {
  resolveEffectiveCompliance,
  getInternalUsageGuidance,
  getClientWorkGuidance,
  getOwnershipGuidance,
  getDataGuidance,
} from '@/lib/complianceGuidance';
import type { CreativeStudioBrand } from '@/types/creative-studio';

// ── Helpers ─────────────────────────────────────────────────────────────────

function getStatusConfig(status: string) {
  switch (status) {
    case 'approved':
      return { label: 'Approved', color: 'bg-green-500', badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
    case 'restricted':
      return { label: 'Restricted', color: 'bg-amber-500', badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' };
    case 'not_approved':
      return { label: 'Not Approved', color: 'bg-red-500', badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
    default:
      return { label: 'Pending', color: 'bg-gray-400', badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
  }
}

function getScopeLabel(scope: string) {
  switch (scope) {
    case 'client_deliverables': return 'Client Deliverables';
    case 'internal_concepting': return 'Internal Concepting';
    case 'internal_only': return 'Internal Only';
    case 'not_allowed': return 'Not Allowed';
    default: return scope;
  }
}

// ── Tool Card ───────────────────────────────────────────────────────────────

function ToolGuidelineCard({ approval }: { approval: BrandToolApproval }) {
  const statusConfig = getStatusConfig(approval.approval_status);

  // Resolve effective compliance from product + vendor
  const vendorDefaults = approval.vendor || {
    access_tier: null,
    output_ownership_rights: null,
    client_approval_required: false,
    training_opt_out: null,
    privacy_tier: null,
  };

  const effective = resolveEffectiveCompliance(vendorDefaults, {
    access_tier: approval.product.access_tier,
    output_ownership_rights: approval.product.output_ownership_rights,
    client_approval_required: approval.product.client_approval_required,
    training_opt_out: approval.product.training_opt_out,
    privacy_tier: approval.product.privacy_tier,
  });

  const internalUsage = getInternalUsageGuidance(effective.accessTier);
  const clientWork = getClientWorkGuidance(effective.accessTier, effective.clientApprovalRequired);
  const ownership = getOwnershipGuidance(effective.outputOwnershipRights);
  const dataGuidance = getDataGuidance(effective.trainingOptOut, effective.privacyTier);

  return (
    <div className="group border rounded-xl p-4 space-y-3 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {approval.product.logo_url ? (
            <img
              src={approval.product.logo_url}
              alt={approval.product.name}
              className="w-8 h-8 rounded-lg object-contain"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Shield className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div>
            <span className="font-semibold text-sm">
              {approval.product.name}
            </span>
            {approval.vendor && (
              <p className="text-[11px] text-muted-foreground">{approval.vendor.name}</p>
            )}
          </div>
        </div>
        <Badge variant="outline" className={statusConfig.badgeClass}>
          {statusConfig.label}
        </Badge>
      </div>

      {/* Usage scope */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Approved for:
        </span>
        <span className="text-[11px] font-semibold">
          {getScopeLabel(approval.usage_scope)}
        </span>
      </div>

      {/* Compliance details grid */}
      <div className="grid grid-cols-2 gap-2">
        <ComplianceRow
          icon={internalUsage.icon}
          iconColor={internalUsage.iconColor}
          label="Internal use"
          value={internalUsage.text}
        />
        <ComplianceRow
          icon={clientWork.icon}
          iconColor={clientWork.iconColor}
          label="Client work"
          value={clientWork.text}
        />
        <ComplianceRow
          icon={ownership.icon}
          iconColor={ownership.iconColor}
          label="Output ownership"
          value={ownership.text}
        />
        <ComplianceRow
          icon={dataGuidance.icon}
          iconColor={dataGuidance.iconColor}
          label="Data policy"
          value={dataGuidance.text}
        />
      </div>

      {/* Notes */}
      {approval.notes && (
        <div className="bg-muted/30 rounded-lg px-3 py-2">
          <p className="text-[11px] text-muted-foreground">
            <strong>Note:</strong> {approval.notes}
          </p>
        </div>
      )}
    </div>
  );
}

function ComplianceRow({
  icon: Icon,
  iconColor,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-1.5">
      <Icon className={`w-3.5 h-3.5 ${iconColor} flex-shrink-0 mt-0.5`} />
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-[11px] leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ── Main Dialog ─────────────────────────────────────────────────────────────

interface AIGuidelinesDialogProps {
  brand: CreativeStudioBrand;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIGuidelinesDialog({ brand, open, onOpenChange }: AIGuidelinesDialogProps) {
  const { data, isLoading } = useBrandToolApprovals(brand.id);
  const approvals = data?.approvals || [];
  const summary = data?.summary;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[88vh] p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Brand AI Guidelines — {brand.name}</DialogTitle>
        <DialogDescription className="sr-only">
          AI tool approval status and compliance guidelines for {brand.name} client work
        </DialogDescription>

        {/* Brand-aware header */}
        <div
          className="relative overflow-hidden px-6 py-5 bg-gray-950"
          style={{ borderBottom: `1px solid ${brand.primary_color}40` }}
        >
          {/* Subtle brand color wash */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at top right, ${brand.primary_color}33, transparent 70%)` }}
          />

          {/* Watermark — full wordmark logo preferred, else initial */}
          {brand.logo_url ? (
            <img
              src={brand.logo_url}
              alt=""
              className="absolute bottom-0 -right-2 h-20 w-auto object-contain opacity-[0.08] pointer-events-none"
            />
          ) : (
            <span className="absolute -bottom-4 -right-6 text-[120px] font-bold text-white/[0.05] leading-none select-none pointer-events-none">
              {brand.name.charAt(0)}
            </span>
          )}

          <div className="relative z-10 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ background: `${brand.primary_color}30`, border: `1px solid ${brand.primary_color}50` }}
            >
              {brand.logo_mark_url ? (
                <img src={brand.logo_mark_url} alt={brand.name} className="w-7 h-7 object-contain" />
              ) : (
                <span className="font-bold text-lg text-white">{brand.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/60">
                Brand AI Guidelines
              </p>
              <h2 className="text-lg font-semibold text-white">
                AI Guidelines for {brand.name} Client Work
              </h2>
            </div>
          </div>

          {/* Summary badges */}
          {summary && summary.total > 0 && (
            <div className="relative z-10 flex items-center gap-2 mt-3">
              {summary.approvedCount > 0 && (
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-300" />
                  <span className="text-[11px] font-medium text-white">
                    {summary.approvedCount} approved
                  </span>
                </div>
              )}
              {summary.restrictedCount > 0 && (
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-[11px] font-medium text-white">
                    {summary.restrictedCount} restricted
                  </span>
                </div>
              )}
              {summary.notApprovedCount > 0 && (
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <XCircle className="w-3.5 h-3.5 text-red-300" />
                  <span className="text-[11px] font-medium text-white">
                    {summary.notApprovedCount} not approved
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <ScrollArea className="flex-1 max-h-[calc(88vh-140px)]">
          <div className="p-6 space-y-6">
            {isLoading && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Loading guidelines...
              </div>
            )}

            {!isLoading && approvals.length === 0 && (
              <div className="text-center py-12 space-y-3">
                <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    No tool approvals configured yet
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Configure which AI tools are approved for {brand.name} in the Admin panel.
                  </p>
                </div>
              </div>
            )}

            {!isLoading && approvals.length > 0 && (
              <>
                {/* Introduction */}
                <div className="space-y-2">
                  <p className="text-sm text-foreground">
                    These guidelines define which AI creative tools are approved for use on <strong>{brand.name}</strong> work,
                    including what&apos;s allowed for client deliverables versus internal concepting. Each tool below shows its
                    approval status, usage scope, and key compliance details.
                  </p>
                </div>

                {/* General policies */}
                <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    General Policies
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2.5 text-xs">
                      <Lock className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">Never upload client PII or confidential data to unapproved tools</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs">
                      <Eye className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">All AI-generated deliverables require human quality review before delivery</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs">
                      <Scale className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">Check output ownership rights before using AI content in paid client deliverables</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs">
                      <FileText className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">Document AI tool usage per project for compliance tracking and audit trails</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    <strong>Questions?</strong>{' '}
                    <button
                      onClick={() => onOpenChange(false)}
                      className="text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      Return to Brand DNA
                    </button>{' '}
                    for full visual identity and governance guidelines.
                  </p>
                </div>

                {/* Tool-by-tool guidelines */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tool-by-Tool Guidelines
                  </h3>
                  {approvals.map(approval => (
                    <ToolGuidelineCard key={approval.id} approval={approval} />
                  ))}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
