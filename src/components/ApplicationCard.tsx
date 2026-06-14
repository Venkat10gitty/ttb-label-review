"use client";

import Link from "next/link";
import { Wine, Beaker, Beer, ChevronRight, Trash2, Zap } from "lucide-react";
import { ReviewStatusBadge } from "./StatusBadge";
import type { Application } from "@/lib/types";
import { BEVERAGE_TYPE_LABELS } from "@/lib/ttb-rules";

const TYPE_ICONS = {
  distilled_spirits: Beaker,
  wine: Wine,
  malt_beverage: Beer,
};

export default function ApplicationCard({
  application,
  onDelete,
  onAnalyze,
}: {
  application: Application;
  onDelete: (id: string) => void;
  onAnalyze: (id: string) => void;
}) {
  const { applicationData: d, status } = application;
  const Icon = TYPE_ICONS[d.beverageType] ?? Wine;
  const isAnalyzing = status === "analyzing";

  const criticalCount = application.reviewResult?.criticalIssues.length ?? 0;
  const warnCount = application.reviewResult?.warnings.length ?? 0;

  return (
    <div className="card hover:shadow-md transition-shadow group animate-fade-in">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 bg-navy-50 border border-navy-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Icon size={18} className="text-navy-700" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 truncate text-sm">
                {d.brandName || "Unnamed Application"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {BEVERAGE_TYPE_LABELS[d.beverageType]} · {d.classTypeDesignation || "—"}
              </p>
              {d.applicantName && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {d.applicantName}
                </p>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            <ReviewStatusBadge status={status} />
          </div>
        </div>

        {(criticalCount > 0 || warnCount > 0) && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {criticalCount > 0 && (
              <span className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-2 py-0.5">
                {criticalCount} critical issue{criticalCount > 1 ? "s" : ""}
              </span>
            )}
            {warnCount > 0 && (
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded px-2 py-0.5">
                {warnCount} warning{warnCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{d.alcoholContent || "—"}</span>
            <span>·</span>
            <span>{d.netContents || "—"}</span>
            {application.imageName && (
              <>
                <span>·</span>
                <span className="text-emerald-600">Image attached</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {status === "pending" && application.imageData && (
              <button
                onClick={() => onAnalyze(application.id)}
                disabled={isAnalyzing}
                className="p-1.5 text-navy-600 hover:bg-navy-50 rounded-lg transition-colors"
                title="Run AI analysis"
              >
                <Zap size={15} />
              </button>
            )}
            <button
              onClick={() => onDelete(application.id)}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete application"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      <Link
        href={`/review/${application.id}`}
        className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 text-xs text-slate-500 hover:bg-slate-50 hover:text-navy-700 transition-colors rounded-b-xl"
      >
        <span>View full review</span>
        <ChevronRight size={14} />
      </Link>
    </div>
  );
}
