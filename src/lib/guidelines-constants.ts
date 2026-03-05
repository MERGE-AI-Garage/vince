// ABOUTME: Shared constants for the AI Guidelines Center (public hub + admin panel)
// ABOUTME: Card styling, category colors, risk mappings, and icon lookups

import {
  Heart, Pill, Landmark, ShieldCheck, UtensilsCrossed, ShoppingCart, Wifi,
  Factory, TrendingUp, Handshake, Crown, Zap, BarChart3, Users, Monitor,
  Beaker, Truck, Megaphone, Settings, Code, Lightbulb, Target,
  PenTool, Building2, Sparkles, Briefcase, Globe,
  GraduationCap, FileText, Shield, Palette,
  Eye, Lock, CheckCircle2, Scale,
} from 'lucide-react';

/* ── Card depth tokens ────────────────────────────────────────── */

export const CARD_BASE = 'rounded-xl border border-border/50 bg-card shadow-[0_1px_4px_rgba(0,0,0,0.06)]';
export const CARD_HOVER = 'hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.12)] hover:-translate-y-1 hover:border-primary/20 transition-all duration-300';

/* ── Department category gradient pairs ───────────────────────── */

export const CATEGORY_COLORS: Record<string, { from: string; to: string }> = {
  'Business & Sales': { from: '#0EA5E9', to: '#0369A1' },
  'Client Services': { from: '#8B5CF6', to: '#6D28D9' },
  'Creative & Content': { from: '#EC4899', to: '#BE185D' },
  'Data & Analytics': { from: '#06B6D4', to: '#0E7490' },
  'Executive & Leadership': { from: '#334155', to: '#1E293B' },
  'Experience & UX': { from: '#F97316', to: '#C2410C' },
  'General': { from: '#6366F1', to: '#4338CA' },
  'Media & Channels': { from: '#14B8A6', to: '#0D9488' },
  'Medical & Regulatory': { from: '#EF4444', to: '#B91C1C' },
  'Operations & Delivery': { from: '#F59E0B', to: '#B45309' },
  'Strategy & Brand': { from: '#A855F7', to: '#7E22CE' },
  'Support Functions': { from: '#64748B', to: '#475569' },
  'Technology': { from: '#10B981', to: '#047857' },
};

export function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] || { from: '#6366F1', to: '#4338CA' };
}

/* ── Risk level color mapping ─────────────────────────────────── */

export const RISK_SLAB: Record<string, { solidBg: string; bg: string; text: string; label: string }> = {
  critical: { solidBg: 'bg-zinc-400 dark:bg-zinc-600', bg: 'bg-red-500/10', text: 'text-red-700 dark:text-red-400', label: 'Critical' },
  high: { solidBg: 'bg-zinc-400 dark:bg-zinc-600', bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', label: 'High' },
  moderate: { solidBg: 'bg-zinc-400 dark:bg-zinc-600', bg: 'bg-yellow-500/10', text: 'text-yellow-700 dark:text-yellow-400', label: 'Moderate' },
  low: { solidBg: 'bg-zinc-400 dark:bg-zinc-600', bg: 'bg-green-500/10', text: 'text-green-700 dark:text-green-400', label: 'Low' },
};

export function getRiskStyle(riskLevel: string | null) {
  return RISK_SLAB[riskLevel || ''] || RISK_SLAB.moderate;
}

/* ── Approval status styling ──────────────────────────────────── */

export const APPROVAL_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', label: 'Approved' },
  restricted: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', label: 'Restricted' },
  not_approved: { bg: 'bg-red-500/10', text: 'text-red-700 dark:text-red-400', label: 'Not Approved' },
};

export function getApprovalStyle(status: string) {
  return APPROVAL_STYLES[status] || APPROVAL_STYLES.restricted;
}

/* ── Usage scope labels ───────────────────────────────────────── */

export const SCOPE_LABELS: Record<string, string> = {
  client_deliverables: 'Client Deliverables',
  internal_concepting: 'Internal Concepting',
  internal_only: 'Internal Only',
  not_allowed: 'Not Allowed',
};

/* ── Icon lookups ─────────────────────────────────────────────── */

export const DEPT_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp, Handshake, Crown, Zap, BarChart3, Users, Monitor,
  Beaker, Truck, Megaphone, Settings, Code, Lightbulb, Target,
  PenTool, Building2, Sparkles, Heart, Briefcase, Globe,
  GraduationCap, FileText, Shield, Factory, Palette,
};

export function getDeptIcon(name: string | null) {
  if (!name) return Building2;
  return DEPT_ICON_MAP[name] || Building2;
}

export const INDUSTRY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart, Pill, Landmark, ShieldCheck, UtensilsCrossed, ShoppingCart, Wifi,
};

export function getIndustryIcon(name: string | null) {
  if (!name) return Factory;
  return INDUSTRY_ICONS[name] || Factory;
}

export const PRINCIPLE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Eye, Lock, CheckCircle2, FileText, Scale, Shield,
};

/* ── Department category list (ordered) ───────────────────────── */

export const DEPARTMENT_CATEGORIES = Object.keys(CATEGORY_COLORS).sort();

