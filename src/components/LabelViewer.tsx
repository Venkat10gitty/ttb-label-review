"use client";

import { useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, AlertTriangle } from "lucide-react";

export default function LabelViewer({
  imageData,
  imageName,
  imageType,
  qualityScore,
  qualityIssues,
}: {
  imageData?: string;
  imageName?: string;
  imageType?: string;
  qualityScore?: number;
  qualityIssues?: string[];
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!imageData) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
          <AlertTriangle size={24} className="text-slate-300" />
        </div>
        <p className="text-sm font-medium">No label image attached</p>
        <p className="text-xs mt-1">Analysis used application data only</p>
      </div>
    );
  }

  const src = `data:${imageType ?? "image/jpeg"};base64,${imageData}`;

  const qualityPercent = qualityScore !== undefined ? Math.round(qualityScore * 100) : null;
  const qualityColor =
    qualityPercent === null
      ? "text-slate-500"
      : qualityPercent >= 80
      ? "text-emerald-600"
      : qualityPercent >= 50
      ? "text-amber-600"
      : "text-red-600";

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs text-slate-500 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors ml-1"
            title="Rotate"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {qualityPercent !== null && (
          <div className={`text-xs font-medium ${qualityColor}`}>
            Image quality: {qualityPercent}%
          </div>
        )}
      </div>

      {/* Image */}
      <div className="overflow-auto rounded-xl border border-slate-200 bg-slate-900 flex items-center justify-center"
           style={{ maxHeight: "480px", minHeight: "200px" }}>
        <img
          src={src}
          alt={imageName ?? "Label image"}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: "center",
            transition: "transform 0.2s ease",
            maxWidth: "100%",
          }}
          className="object-contain"
        />
      </div>

      {/* Quality issues */}
      {qualityIssues && qualityIssues.length > 0 && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-700">
            <span className="font-semibold">Image quality notes: </span>
            {qualityIssues.join(", ")}
          </div>
        </div>
      )}

      {imageName && (
        <p className="text-xs text-slate-400 truncate">{imageName}</p>
      )}
    </div>
  );
}
