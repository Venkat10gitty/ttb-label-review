"use client";

import { useState, useRef } from "react";
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import type { ApplicationData, BeverageType } from "@/lib/types";
import { BEVERAGE_TYPE_LABELS } from "@/lib/ttb-rules";

const EMPTY_FORM: ApplicationData = {
  applicantName: "",
  brandName: "",
  beverageType: "distilled_spirits",
  classTypeDesignation: "",
  alcoholContent: "",
  netContents: "",
  bottlerName: "",
  bottlerAddress: "",
  countryOfOrigin: "",
  vintageDate: "",
  sulfiteDeclaration: "",
  hasGovernmentWarning: true,
  additionalInfo: "",
};

export default function NewApplicationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<ApplicationData>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImageChange(file: File | null) {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageChange(file);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("applicationData", JSON.stringify(form));
      if (imageFile) fd.append("image", imageFile);

      const res = await fetch("/api/applications", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());

      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application");
    } finally {
      setLoading(false);
    }
  }

  const field = (
    label: string,
    key: keyof ApplicationData,
    opts?: {
      placeholder?: string;
      required?: boolean;
      type?: string;
    }
  ) => (
    <div>
      <label className="field-label block mb-1">
        {label}
        {opts?.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        className="input"
        type={opts?.type ?? "text"}
        placeholder={opts?.placeholder ?? ""}
        required={opts?.required}
        value={String(form[key] ?? "")}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">New Label Application</h2>
            <p className="text-sm text-slate-500">Submit a label for TTB compliance review</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Label Image Upload */}
          <div>
            <label className="field-label block mb-2">Label Image</label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-4 cursor-pointer
                         hover:border-navy-500 hover:bg-navy-50 transition-colors text-center"
            >
              {imagePreview ? (
                <div className="flex items-center gap-4">
                  <img
                    src={imagePreview}
                    alt="Label preview"
                    className="w-24 h-24 object-contain rounded-lg border border-slate-200"
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-700">{imageFile?.name}</p>
                    <p className="text-xs text-slate-400 mt-1">Click to change image</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                    <ImageIcon size={22} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Drop label image here</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      JPG, PNG, WebP · Works with photos, scans, even imperfect angles
                    </p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Application Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">
              Application Details
            </h3>
            {field("Applicant / Company Name", "applicantName", {
              placeholder: "Old Tom Distillery LLC",
              required: true,
            })}
            <div className="grid grid-cols-2 gap-4">
              {field("Brand Name", "brandName", {
                placeholder: "OLD TOM DISTILLERY",
                required: true,
              })}
              <div>
                <label className="field-label block mb-1">
                  Beverage Type <span className="text-red-500">*</span>
                </label>
                <select
                  className="select"
                  value={form.beverageType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      beverageType: e.target.value as BeverageType,
                    }))
                  }
                >
                  {(Object.keys(BEVERAGE_TYPE_LABELS) as BeverageType[]).map((k) => (
                    <option key={k} value={k}>
                      {BEVERAGE_TYPE_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {field("Class / Type Designation", "classTypeDesignation", {
              placeholder: "BOURBON WHISKEY / CABERNET SAUVIGNON / ALE",
              required: true,
            })}
          </div>

          {/* Regulatory Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">
              Regulatory Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {field("Alcohol Content (ABV)", "alcoholContent", {
                placeholder: "40% ALC/VOL",
                required: true,
              })}
              {field("Net Contents", "netContents", {
                placeholder: "750 ML",
                required: true,
              })}
            </div>
            {field("Bottler / Producer Name", "bottlerName", {
              placeholder: "Old Tom Distillery, LLC",
              required: true,
            })}
            {field("Bottler / Producer Address", "bottlerAddress", {
              placeholder: "123 Main St, Louisville, KY 40202",
              required: true,
            })}
            {field("Country of Origin", "countryOfOrigin", {
              placeholder: "USA (or leave blank for domestic)",
            })}
            {form.beverageType === "wine" && (
              <div className="grid grid-cols-2 gap-4">
                {field("Vintage Date", "vintageDate", { placeholder: "2022" })}
                {field("Sulfite Declaration", "sulfiteDeclaration", {
                  placeholder: "Contains Sulfites",
                })}
              </div>
            )}
          </div>

          {/* Government Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.hasGovernmentWarning}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hasGovernmentWarning: e.target.checked }))
                }
                className="mt-0.5 w-4 h-4 rounded border-amber-400 text-navy-700 focus:ring-navy-600"
              />
              <div>
                <span className="text-sm font-semibold text-amber-800">
                  Government Warning Statement Present
                </span>
                <p className="text-xs text-amber-700 mt-1">
                  Confirm that the label includes the mandatory TTB Government Warning Statement
                  with &quot;GOVERNMENT WARNING:&quot; in all caps and bold.
                </p>
              </div>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
