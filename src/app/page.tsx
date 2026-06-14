"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, RefreshCw, Search, Filter, FileDown, FlaskConical } from "lucide-react";
import Header from "@/components/Header";
import StatsBar from "@/components/StatsBar";
import ApplicationCard from "@/components/ApplicationCard";
import NewApplicationModal from "@/components/NewApplicationModal";
import type { Application, ReviewStatus } from "@/lib/types";

const STATUS_FILTERS: { label: string; value: ReviewStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Flagged", value: "flagged" },
  { label: "Rejected", value: "rejected" },
];

export default function HomePage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">("all");
  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set());

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, 5000);
    return () => clearInterval(interval);
  }, [fetchApplications]);

  async function handleAnalyze(id: string) {
    setAnalyzing((prev) => new Set(prev).add(id));
    try {
      await fetch(`/api/applications/${id}/analyze`, { method: "POST" });
      await fetchApplications();
    } finally {
      setAnalyzing((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this application?")) return;
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    setApplications((prev) => prev.filter((a) => a.id !== id));
  }

  async function loadDemo() {
    setLoadingDemo(true);
    try {
      await fetch("/api/demo", { method: "POST" });
      await fetchApplications();
    } finally {
      setLoadingDemo(false);
    }
  }

  function exportCSV() {
    const rows = [
      ["ID", "Brand Name", "Type", "ABV", "Status", "Critical Issues", "Submitted"],
      ...filtered.map((a) => [
        a.id,
        a.applicationData.brandName,
        a.applicationData.beverageType,
        a.applicationData.alcoholContent,
        a.status,
        a.reviewResult?.criticalIssues.length ?? 0,
        new Date(a.createdAt).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ttb-applications-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  const filtered = applications.filter((a) => {
    const matchesSearch =
      !search ||
      a.applicationData.brandName.toLowerCase().includes(search.toLowerCase()) ||
      a.applicationData.applicantName?.toLowerCase().includes(search.toLowerCase()) ||
      a.applicationData.classTypeDesignation.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Label Applications</h1>
            <p className="text-sm text-slate-500 mt-1">
              AI-powered TTB compliance review · {applications.length} total application{applications.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {applications.length === 0 && (
              <button
                onClick={loadDemo}
                disabled={loadingDemo}
                className="btn-secondary text-sm border-dashed"
                title="Load sample applications to explore the UI"
              >
                <FlaskConical size={15} />
                {loadingDemo ? "Loading..." : "Load Demo Data"}
              </button>
            )}
            <button onClick={exportCSV} className="btn-secondary text-sm">
              <FileDown size={15} />
              Export CSV
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary text-sm"
            >
              <Plus size={16} />
              New Application
            </button>
          </div>
        </div>

        {/* Stats */}
        <StatsBar applications={applications} />

        {/* Search + Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search by brand name, applicant, or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
            <Filter size={14} className="text-slate-400 mx-1.5" />
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                  statusFilter === f.value
                    ? "bg-navy-700 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchApplications}
            className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Applications grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card h-36 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Search size={28} className="text-slate-300" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">
              {applications.length === 0 ? "No applications yet" : "No results found"}
            </h3>
            <p className="text-sm text-slate-400 max-w-xs">
              {applications.length === 0
                ? "Submit your first label application to get started with AI-powered TTB compliance review."
                : "Try adjusting your search or filter criteria."}
            </p>
            {applications.length === 0 && (
              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={loadDemo}
                  disabled={loadingDemo}
                  className="btn-secondary text-sm border-dashed"
                >
                  <FlaskConical size={15} />
                  {loadingDemo ? "Loading..." : "Load Demo Data"}
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-primary text-sm"
                >
                  <Plus size={15} />
                  New Application
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((app) => (
              <ApplicationCard
                key={app.id}
                application={analyzing.has(app.id) ? { ...app, status: "analyzing" } : app}
                onDelete={handleDelete}
                onAnalyze={handleAnalyze}
              />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <NewApplicationModal
          onClose={() => setShowModal(false)}
          onCreated={fetchApplications}
        />
      )}
    </div>
  );
}
