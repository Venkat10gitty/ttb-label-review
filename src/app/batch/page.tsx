"use client";

import Header from "@/components/Header";
import BatchUploader from "@/components/BatchUploader";
import { Upload, Clock, Zap, FileJson } from "lucide-react";

export default function BatchPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Batch Upload</h1>
          <p className="text-sm text-slate-500 mt-1">
            Process hundreds of label applications simultaneously
          </p>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: Upload,
              label: "Bulk Import",
              desc: "Upload 200–300+ applications at once via JSON + images",
            },
            {
              icon: Zap,
              label: "Parallel Analysis",
              desc: "Concurrent AI processing with automatic rate management",
            },
            {
              icon: Clock,
              label: "Live Progress",
              desc: "Real-time status updates as each label is analyzed",
            },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="card p-4 text-center">
              <div className="w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Icon size={18} className="text-navy-700" />
              </div>
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              <p className="text-xs text-slate-500 mt-1">{desc}</p>
            </div>
          ))}
        </div>

        {/* Format guide */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileJson size={16} className="text-navy-700" />
            <h3 className="text-sm font-semibold text-slate-700">
              Metadata JSON Format
            </h3>
          </div>
          <pre className="text-xs bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto leading-relaxed">
{`[
  {
    "fileName": "label1.jpg",          // Must match uploaded image name
    "applicationData": {
      "applicantName": "Distillery LLC",
      "brandName": "OLD TOM DISTILLERY",
      "beverageType": "distilled_spirits",
      "classTypeDesignation": "BOURBON WHISKEY",
      "alcoholContent": "45% ALC/VOL",
      "netContents": "750 ML",
      "bottlerName": "Old Tom Distillery, LLC",
      "bottlerAddress": "123 Barrel Lane, Louisville, KY 40202",
      "countryOfOrigin": "",
      "hasGovernmentWarning": true
    }
  }
  // ... more entries
]`}
          </pre>
          <div className="mt-3 text-xs text-slate-500">
            <strong>beverageType</strong> must be one of:{" "}
            <code className="bg-slate-100 rounded px-1">distilled_spirits</code>{" "}
            <code className="bg-slate-100 rounded px-1">wine</code>{" "}
            <code className="bg-slate-100 rounded px-1">malt_beverage</code>
          </div>
        </div>

        {/* Uploader */}
        <BatchUploader />
      </main>
    </div>
  );
}
