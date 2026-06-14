"use client";

import type { ReviewStatus, FieldStatus } from "@/lib/types";

const REVIEW_CONFIG: Record<
  ReviewStatus,
  { label: string; className: string; dot: string }
> = {
  pending: {
    label: "Pending Review",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
  analyzing: {
    label: "Analyzing...",
    className: "bg-blue-50 text-blue-600 border-blue-200",
    dot: "bg-blue-500 animate-pulse",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  flagged: {
    label: "Flagged",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
};

const FIELD_CONFIG: Record<
  FieldStatus,
  { label: string; icon: string; className: string }
> = {
  match: { label: "Match", icon: "✓", className: "status-match" },
  smart_match: { label: "Smart Match", icon: "≈", className: "status-smart_match" },
  warning: { label: "Review", icon: "!", className: "status-warning" },
  mismatch: { label: "Mismatch", icon: "✗", className: "status-mismatch" },
  missing: { label: "Missing", icon: "✗", className: "status-missing" },
  not_required: { label: "N/A", icon: "—", className: "status-not_required" },
};

export function ReviewStatusBadge({
  status,
  size = "sm",
}: {
  status: ReviewStatus;
  size?: "sm" | "md";
}) {
  const cfg = REVIEW_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full ${cfg.className} ${
        size === "sm" ? "text-xs px-2.5 py-0.5" : "text-sm px-3 py-1"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function FieldStatusBadge({ status }: { status: FieldStatus }) {
  const cfg = FIELD_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold border rounded px-2 py-0.5 ${cfg.className}`}
    >
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}
