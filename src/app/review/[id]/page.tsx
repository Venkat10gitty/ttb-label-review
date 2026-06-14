"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Zap,
  CheckCircle,
  XCircle,
  Flag,
  Loader2,
  MessageSquare,
  Save,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import LabelViewer from "@/components/LabelViewer";
import ComplianceReport from "@/components/ComplianceReport";
import { ReviewStatusBadge } from "@/components/StatusBadge";
import type { Application } from "@/lib/types";
import { BEVERAGE_TYPE_LABELS } from "@/lib/ttb-rules";

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApp = useCallback(async () => {
    try {
      const res = await fetch(`/api/applications/${id}`);
      if (res.status === 404) {
        router.push("/");
        return;
      }
      const data: Application = await res.json();
      setApp(data);
      if (data.reviewResult?.agentNotes) setNotes(data.reviewResult.agentNotes);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchApp();
    const poll = setInterval(() => {
      setApp((prev) => {
        if (prev?.status === "analyzing") {
          fetchApp();
        }
        return prev;
      });
    }, 3000);
    return () => clearInterval(poll);
  }, [fetchApp]);

  async function runAnalysis() {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/applications/${id}/analyze`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setApp(data);
      else alert("Analysis failed: " + (data.error ?? "Unknown error"));
    } finally {
      setAnalyzing(false);
    }
  }

  async function setStatus(status: "approved" | "rejected" | "flagged") {
    setActionLoading(true);
    try {
      const updatedResult = app?.reviewResult
        ? { ...app.reviewResult, overallStatus: status, agentNotes: notes }
        : undefined;
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewResult: updatedResult }),
      });
      if (res.ok) setApp(await res.json());
    } finally {
      setActionLoading(false);
    }
  }

  async function saveNotes() {
    setSavingNotes(true);
    try {
      const updatedResult = app?.reviewResult
        ? { ...app.reviewResult, agentNotes: notes }
        : undefined;
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewResult: updatedResult }),
      });
      if (res.ok) setApp(await res.json());
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center h-64">
          <Loader2 size={28} className="animate-spin text-navy-700" />
        </div>
      </div>
    );
  }

  if (!app) return null;

  const d = app.applicationData;
  const isAnalyzing = app.status === "analyzing" || analyzing;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Back + title */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <Link
              href="/"
              className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600 transition-colors mt-0.5 flex-shrink-0"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">
                  {d.brandName || "Unnamed Application"}
                </h1>
                <ReviewStatusBadge status={app.status} size="md" />
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {BEVERAGE_TYPE_LABELS[d.beverageType]} · {d.classTypeDesignation}
                {d.applicantName ? ` · ${d.applicantName}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {!app.reviewResult && !isAnalyzing && app.imageData && (
              <button onClick={runAnalysis} className="btn-primary text-sm">
                <Zap size={15} />
                Run AI Analysis
              </button>
            )}
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <Loader2 size={15} className="animate-spin" />
                Analyzing with Claude...
              </div>
            )}
            {app.reviewResult && !isAnalyzing && app.imageData && (
              <button
                onClick={runAnalysis}
                className="btn-secondary text-sm"
                title="Re-run analysis"
              >
                <RefreshCw size={14} />
                Re-analyze
              </button>
            )}
          </div>
        </div>

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Label Image + Application Info */}
          <div className="space-y-5">
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Label Image</h2>
              <LabelViewer
                imageData={app.imageData}
                imageName={app.imageName}
                imageType={app.imageType}
                qualityScore={app.extractedData?.imageQuality.score}
                qualityIssues={app.extractedData?.imageQuality.issues}
              />
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Application Data</h2>
              <dl className="space-y-3">
                {[
                  { label: "Brand Name", value: d.brandName },
                  { label: "Type", value: BEVERAGE_TYPE_LABELS[d.beverageType] },
                  { label: "Class/Type Designation", value: d.classTypeDesignation },
                  { label: "Alcohol Content", value: d.alcoholContent },
                  { label: "Net Contents", value: d.netContents },
                  { label: "Bottler/Producer", value: d.bottlerName },
                  { label: "Address", value: d.bottlerAddress },
                  d.countryOfOrigin ? { label: "Country of Origin", value: d.countryOfOrigin } : null,
                  d.vintageDate ? { label: "Vintage Date", value: d.vintageDate } : null,
                ]
                  .filter(Boolean)
                  .map((item) => (
                    <div key={item!.label} className="flex gap-3">
                      <dt className="text-xs text-slate-400 w-36 flex-shrink-0 pt-0.5">
                        {item!.label}
                      </dt>
                      <dd className="text-sm text-slate-700 font-medium">
                        {item!.value || "—"}
                      </dd>
                    </div>
                  ))}
                <div className="flex gap-3">
                  <dt className="text-xs text-slate-400 w-36 flex-shrink-0 pt-0.5">
                    Govt. Warning
                  </dt>
                  <dd className={`text-sm font-medium ${d.hasGovernmentWarning ? "text-emerald-600" : "text-red-600"}`}>
                    {d.hasGovernmentWarning ? "Checked as present" : "Not checked"}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Agent Notes */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <MessageSquare size={15} />
                Reviewer Notes
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes, observations, or decisions for this application..."
                className="input resize-none text-sm"
                rows={4}
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-400">
                  Notes are saved with this application
                </p>
                <button
                  onClick={saveNotes}
                  disabled={savingNotes}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  {savingNotes ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Save Notes
                </button>
              </div>
            </div>
          </div>

          {/* Right: Compliance Report + Actions */}
          <div className="space-y-5">
            {/* Action buttons */}
            {app.reviewResult && (
              <div className="card p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Final Decision
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setStatus("approved")}
                    disabled={actionLoading || app.status === "approved"}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors border ${
                      app.status === "approved"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    }`}
                  >
                    <CheckCircle size={15} />
                    Approve
                  </button>
                  <button
                    onClick={() => setStatus("flagged")}
                    disabled={actionLoading || app.status === "flagged"}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors border ${
                      app.status === "flagged"
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-amber-700 border-amber-300 hover:bg-amber-50"
                    }`}
                  >
                    <Flag size={15} />
                    Flag
                  </button>
                  <button
                    onClick={() => setStatus("rejected")}
                    disabled={actionLoading || app.status === "rejected"}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors border ${
                      app.status === "rejected"
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-white text-red-700 border-red-300 hover:bg-red-50"
                    }`}
                  >
                    <XCircle size={15} />
                    Reject
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">
                  AI decision can be overridden by the reviewer
                </p>
              </div>
            )}

            {/* Compliance report */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">
                Compliance Analysis
              </h2>
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
                  <Loader2 size={28} className="animate-spin text-navy-600" />
                  <p className="text-sm">Claude is analyzing the label...</p>
                  <p className="text-xs text-center max-w-xs">
                    Extracting text, checking fields, validating government warning statement
                  </p>
                </div>
              ) : app.reviewResult ? (
                <ComplianceReport result={app.reviewResult} />
              ) : (
                <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
                  <Zap size={28} className="text-slate-300" />
                  <p className="text-sm font-medium">No analysis yet</p>
                  <p className="text-xs text-center max-w-xs">
                    {app.imageData
                      ? "Click \"Run AI Analysis\" to have Claude review the label against the application data."
                      : "No image attached. Please re-submit with a label image to enable AI analysis."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
