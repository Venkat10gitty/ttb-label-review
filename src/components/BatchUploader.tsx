"use client";

import { useState, useRef } from "react";
import { Upload, FileJson, X, Loader2, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Application, BatchJob, BeverageType } from "@/lib/types";

const SAMPLE_METADATA = JSON.stringify(
  [
    {
      fileName: "label1.jpg",
      applicationData: {
        applicantName: "Old Tom Distillery LLC",
        brandName: "OLD TOM DISTILLERY",
        beverageType: "distilled_spirits" as BeverageType,
        classTypeDesignation: "BOURBON WHISKEY",
        alcoholContent: "45% ALC/VOL",
        netContents: "750 ML",
        bottlerName: "Old Tom Distillery, LLC",
        bottlerAddress: "123 Barrel Lane, Louisville, KY 40202",
        countryOfOrigin: "",
        hasGovernmentWarning: true,
      },
    },
  ],
  null,
  2
);

export default function BatchUploader() {
  const [metadataFile, setMetadataFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<
    Array<{ fileName: string; applicationData: Record<string, unknown> }>
  >([]);
  const [imageFiles, setImageFiles] = useState<Map<string, File>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<{
    batchId: string;
    total: number;
  } | null>(null);
  const [pollData, setPollData] = useState<{
    batch: BatchJob;
    applications: Application[];
  } | null>(null);

  const metaRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<HTMLInputElement>(null);

  function handleMetadataUpload(file: File) {
    setMetadataFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!Array.isArray(parsed)) throw new Error("JSON must be an array");
        setMetadata(parsed);
      } catch (err) {
        setError(`Invalid JSON: ${err instanceof Error ? err.message : "Parse error"}`);
        setMetadata([]);
      }
    };
    reader.readAsText(file);
  }

  function handleImagesUpload(files: FileList) {
    const map = new Map(imageFiles);
    Array.from(files).forEach((f) => map.set(f.name, f));
    setImageFiles(map);
  }

  async function handleSubmit() {
    if (metadata.length === 0) {
      setError("Please upload a metadata JSON file first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("metadata", JSON.stringify(metadata));

      for (const item of metadata) {
        const imgFile = imageFiles.get(item.fileName);
        if (imgFile) {
          fd.append(`image_${item.fileName}`, imgFile);
        }
      }

      const res = await fetch("/api/batch", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setBatchResult({ batchId: data.batchId, total: data.totalCount });

      pollBatch(data.batchId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch submission failed");
    } finally {
      setLoading(false);
    }
  }

  async function pollBatch(batchId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/batch?batchId=${batchId}`);
        if (!res.ok) return;
        const data = await res.json();
        setPollData(data);
        if (data.batch.status === "complete") {
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 2000);
  }

  const matchedImages = metadata.filter((m) => imageFiles.has(m.fileName)).length;
  const unmatchedImages = metadata.length - matchedImages;

  return (
    <div className="space-y-6 animate-fade-in">
      {batchResult ? (
        <BatchProgress
          batchResult={batchResult}
          pollData={pollData}
        />
      ) : (
        <>
          {/* Step 1: Metadata JSON */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-navy-700 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Upload Application Metadata</h3>
                <p className="text-sm text-slate-500">
                  JSON array with application data and image file names
                </p>
              </div>
            </div>

            <div
              onClick={() => metaRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-5 cursor-pointer hover:border-navy-500 hover:bg-navy-50 transition-colors"
            >
              {metadataFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileJson size={20} className="text-navy-700" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{metadataFile.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {metadata.length} application{metadata.length !== 1 ? "s" : ""} loaded
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMetadataFile(null);
                      setMetadata([]);
                    }}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2">
                  <FileJson size={28} className="text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">Drop metadata.json here</p>
                  <p className="text-xs text-slate-400">
                    Array of {"{fileName, applicationData}"} objects
                  </p>
                </div>
              )}
            </div>
            <input
              ref={metaRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleMetadataUpload(e.target.files[0])}
            />

            {/* Sample download */}
            <button
              onClick={() => {
                const blob = new Blob([SAMPLE_METADATA], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "sample-metadata.json";
                a.click();
              }}
              className="text-xs text-navy-600 hover:underline"
            >
              Download sample metadata.json template
            </button>
          </div>

          {/* Step 2: Images */}
          {metadata.length > 0 && (
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-navy-700 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Upload Label Images</h3>
                  <p className="text-sm text-slate-500">
                    File names must match the fileName fields in your JSON
                  </p>
                </div>
              </div>

              <div
                onClick={() => imagesRef.current?.click()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleImagesUpload(e.dataTransfer.files);
                }}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-5 cursor-pointer hover:border-navy-500 hover:bg-navy-50 transition-colors"
              >
                <div className="flex flex-col items-center gap-2 py-2">
                  <Upload size={28} className="text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">
                    {imageFiles.size > 0
                      ? `${imageFiles.size} image${imageFiles.size > 1 ? "s" : ""} selected — click to add more`
                      : "Drop label images here or click to browse"}
                  </p>
                  <p className="text-xs text-slate-400">JPG, PNG, WebP</p>
                </div>
              </div>
              <input
                ref={imagesRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleImagesUpload(e.target.files)}
              />

              {/* Match status */}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle size={14} />
                  {matchedImages} matched
                </span>
                {unmatchedImages > 0 && (
                  <span className="text-amber-600 flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {unmatchedImages} unmatched (will process without image)
                  </span>
                )}
              </div>

              {/* File list */}
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto border border-slate-100 rounded-lg">
                {metadata.map((item) => {
                  const hasImage = imageFiles.has(item.fileName);
                  return (
                    <div key={item.fileName} className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${hasImage ? "bg-emerald-500" : "bg-amber-400"}`} />
                        <span className="text-xs font-mono text-slate-600 truncate">{item.fileName}</span>
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                        {(item.applicationData as { brandName?: string })?.brandName ?? "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit */}
          {metadata.length > 0 && (
            <div className="space-y-3">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                  {error}
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={loading || metadata.length === 0}
                className="btn-primary w-full justify-center py-3"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting Batch...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Submit {metadata.length} Applications for Review
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BatchProgress({
  batchResult,
  pollData,
}: {
  batchResult: { batchId: string; total: number };
  pollData: { batch: BatchJob; applications: Application[] } | null;
}) {
  const batch = pollData?.batch;
  const apps = pollData?.applications ?? [];
  const processed = batch?.processedCount ?? 0;
  const total = batchResult.total;
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;
  const isDone = batch?.status === "complete";

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900">Batch Processing</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {isDone ? "Complete" : "Analyzing labels with AI..."}
            </p>
          </div>
          {isDone ? (
            <CheckCircle size={22} className="text-emerald-500" />
          ) : (
            <Loader2 size={22} className="text-navy-600 animate-spin" />
          )}
        </div>

        {/* Progress bar */}
        <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 bg-navy-700 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-xs text-slate-500">
          <span>{processed} of {total} processed</span>
          <span>{pct}%</span>
        </div>

        {/* Stats */}
        {batch && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-emerald-700">{batch.approvedCount}</div>
              <div className="text-xs text-emerald-600">Approved</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-amber-700">{batch.flaggedCount}</div>
              <div className="text-xs text-amber-600">Flagged</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-red-700">{batch.rejectedCount}</div>
              <div className="text-xs text-red-600">Rejected</div>
            </div>
          </div>
        )}
      </div>

      {/* Application list */}
      {apps.length > 0 && (
        <div className="card divide-y divide-slate-100">
          {apps.map((app) => (
            <Link
              key={app.id}
              href={`/review/${app.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors group"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{app.applicationData.brandName}</p>
                <p className="text-xs text-slate-400 mt-0.5">{app.applicationData.classTypeDesignation}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  app.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                  app.status === "flagged" ? "bg-amber-100 text-amber-700" :
                  app.status === "rejected" ? "bg-red-100 text-red-700" :
                  app.status === "analyzing" ? "bg-blue-100 text-blue-700" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  {app.status}
                </span>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
