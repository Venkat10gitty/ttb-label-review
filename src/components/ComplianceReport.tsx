"use client";

import { AlertTriangle, CheckCircle2, XCircle, Info, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { FieldStatusBadge } from "./StatusBadge";
import type { ReviewResult } from "@/lib/types";
import { GOVERNMENT_WARNING_TEXT } from "@/lib/ttb-rules";

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
      </button>
      {open && <div className="bg-white">{children}</div>}
    </div>
  );
}

export default function ComplianceReport({ result }: { result: ReviewResult }) {
  const { fields, criticalIssues, warnings, recommendations, governmentWarningDetails } = result;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Critical Issues */}
      {criticalIssues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-red-700 text-sm">
            <XCircle size={16} />
            {criticalIssues.length} Critical Issue{criticalIssues.length > 1 ? "s" : ""}
          </div>
          <ul className="space-y-1">
            {criticalIssues.map((issue, i) => (
              <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-700 text-sm">
            <AlertTriangle size={16} />
            {warnings.length} Warning{warnings.length > 1 ? "s" : ""} — Manual Review Required
          </div>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* All clear */}
      {criticalIssues.length === 0 && warnings.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-700">All fields compliant</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Label matches application data and meets TTB requirements
            </p>
          </div>
        </div>
      )}

      {/* Field-by-field comparison */}
      <Section title="Field-by-Field Comparison">
        <div className="divide-y divide-slate-100">
          {fields.map((f) => (
            <div key={f.field} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-sm font-medium text-slate-700">{f.label}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {f.required && (
                    <span className="text-xs text-slate-400">Required</span>
                  )}
                  <FieldStatusBadge status={f.status} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5 uppercase tracking-wide font-medium">Application Says</p>
                  <p className="text-xs text-slate-600 font-mono bg-slate-50 rounded p-1.5 break-words">
                    {f.field === "governmentWarning" && f.applicationValue.includes("Required")
                      ? f.applicationValue
                      : f.applicationValue || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5 uppercase tracking-wide font-medium">Label Shows</p>
                  <p className={`text-xs font-mono rounded p-1.5 break-words ${
                    f.status === "mismatch" || f.status === "missing"
                      ? "text-red-700 bg-red-50"
                      : f.status === "match"
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-slate-600 bg-slate-50"
                  }`}>
                    {f.labelValue || "Not found"}
                  </p>
                </div>
              </div>
              {f.notes && (
                <p className="text-xs text-slate-500 mt-1.5 italic">{f.notes}</p>
              )}
              {f.confidence < 0.9 && f.status !== "match" && (
                <p className="text-xs text-slate-400 mt-1">
                  Extraction confidence: {Math.round(f.confidence * 100)}%
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Government Warning Detail */}
      <Section title="Government Warning Analysis" defaultOpen={!governmentWarningDetails.present || !governmentWarningDetails.isTextExact}>
        <div className="px-4 py-3 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Present on Label", ok: governmentWarningDetails.present },
              { label: "Header in ALL CAPS", ok: governmentWarningDetails.headerIsAllCaps },
              { label: "Header is Bold", ok: governmentWarningDetails.headerIsBold },
              { label: "Text Word-for-Word", ok: governmentWarningDetails.isTextExact },
            ].map(({ label, ok }) => (
              <div key={label} className={`rounded-lg p-2.5 text-center border ${ok ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                <div className={`text-lg mb-1 ${ok ? "text-emerald-600" : "text-red-500"}`}>
                  {ok ? "✓" : "✗"}
                </div>
                <p className={`text-xs font-medium ${ok ? "text-emerald-700" : "text-red-700"}`}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Required Text (27 CFR 16.21)
            </p>
            <p className="text-xs text-slate-700 font-mono leading-relaxed">
              <strong>GOVERNMENT WARNING:</strong> {GOVERNMENT_WARNING_TEXT.replace("GOVERNMENT WARNING: ", "")}
            </p>
          </div>

          {governmentWarningDetails.text && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Found on Label
              </p>
              <p className="text-xs text-slate-700 font-mono leading-relaxed">
                {governmentWarningDetails.text}
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Section title="Recommendations" defaultOpen={false}>
          <div className="px-4 py-3 space-y-2">
            {recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                {r}
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
        <Shield size={12} />
        Analysis completed {new Date(result.analysisTimestamp).toLocaleString()}
      </div>
    </div>
  );
}
