import type { FieldStatus } from "./types";
import { GOVERNMENT_WARNING_TEXT, GOVERNMENT_WARNING_HEADER } from "./ttb-rules";

export interface MatchResult {
  status: FieldStatus;
  confidence: number;
  notes?: string;
}

function normalize(s: string): string {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function extractNumeric(s: string): number | null {
  const match = (s ?? "").match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

function extractVolume(s: string): { value: number; unit: string } | null {
  const match = (s ?? "")
    .toLowerCase()
    .match(/(\d+(?:\.\d+)?)\s*(ml|l|oz|fl\.?\s*oz\.?|liters?|milliliters?)/i);
  if (!match) return null;
  let value = parseFloat(match[1]);
  let unit = match[2].toLowerCase().replace(/\s/g, "").replace(/\./, "");
  if (unit === "l" || unit === "liter" || unit === "liters") {
    value = value * 1000;
    unit = "ml";
  }
  if (unit === "oz" || unit === "floz" || unit === "fluidoz") {
    value = Math.round(value * 29.5735);
    unit = "ml";
  }
  return { value: Math.round(value), unit: "ml" };
}

export function smartMatch(appValue: string, labelValue: string): MatchResult {
  if (!appValue && !labelValue) return { status: "not_required", confidence: 1 };
  if (!labelValue) return { status: "missing", confidence: 1, notes: "Field not found on label" };
  if (!appValue) return { status: "warning", confidence: 0.8, notes: "Application value not provided" };

  const normApp = normalize(appValue);
  const normLabel = normalize(labelValue);

  if (normApp === normLabel) {
    return { status: "match", confidence: 1 };
  }

  const stripPunct = (s: string) =>
    s.replace(/['''\-–—,.]/g, "").replace(/\s+/g, " ").trim();

  if (stripPunct(normApp) === stripPunct(normLabel)) {
    return {
      status: "smart_match",
      confidence: 0.95,
      notes: `Case or punctuation difference: "${appValue}" vs "${labelValue}"`,
    };
  }

  const ratio = similarity(normApp, normLabel);
  if (ratio > 0.9) {
    return {
      status: "smart_match",
      confidence: ratio,
      notes: `Minor spelling difference (${Math.round(ratio * 100)}% similar)`,
    };
  }
  if (ratio > 0.75) {
    return {
      status: "warning",
      confidence: ratio,
      notes: `Possible match — manual review needed (${Math.round(ratio * 100)}% similar)`,
    };
  }

  return {
    status: "mismatch",
    confidence: ratio,
    notes: `Values differ significantly: "${appValue}" vs "${labelValue}"`,
  };
}

export function numericMatch(
  appValue: string,
  labelValue: string,
  type: "abv" | "volume"
): MatchResult {
  if (!labelValue) return { status: "missing", confidence: 1, notes: "Field not found on label" };

  if (type === "abv") {
    const appNum = extractNumeric(appValue);
    const labelNum = extractNumeric(labelValue);
    if (appNum === null) return { status: "warning", confidence: 0.7, notes: "Could not parse application ABV" };
    if (labelNum === null) return { status: "warning", confidence: 0.7, notes: "Could not parse label ABV" };
    if (Math.abs(appNum - labelNum) < 0.1) {
      return { status: "match", confidence: 0.99, notes: `Both read ${appNum}%` };
    }
    return {
      status: "mismatch",
      confidence: 0.99,
      notes: `Application states ${appNum}% but label shows ${labelNum}%`,
    };
  }

  if (type === "volume") {
    const appVol = extractVolume(appValue);
    const labelVol = extractVolume(labelValue);
    if (!appVol || !labelVol) {
      return smartMatch(appValue, labelValue);
    }
    if (Math.abs(appVol.value - labelVol.value) <= 1) {
      return { status: "match", confidence: 0.99, notes: `Both read ~${appVol.value}ml` };
    }
    return {
      status: "mismatch",
      confidence: 0.99,
      notes: `Application states ~${appVol.value}ml but label shows ~${labelVol.value}ml`,
    };
  }

  return { status: "warning", confidence: 0.5 };
}

export function fuzzyMatch(appValue: string, labelValue: string): MatchResult {
  if (!appValue && !labelValue) return { status: "not_required", confidence: 1 };
  if (!labelValue) return { status: "missing", confidence: 1, notes: "Field not found on label" };

  const normApp = normalize(appValue);
  const normLabel = normalize(labelValue);

  if (normApp === normLabel) return { status: "match", confidence: 1 };

  const expandAbbr = (s: string) =>
    s
      .replace(/\bco\.?\b/g, "company")
      .replace(/\bllc\.?\b/g, "llc")
      .replace(/\binc\.?\b/g, "incorporated")
      .replace(/\bst\.?\b/g, "street")
      .replace(/\brd\.?\b/g, "road")
      .replace(/\bave\.?\b/g, "avenue")
      .replace(/\bdr\.?\b/g, "drive")
      .replace(/\bblvd\.?\b/g, "boulevard")
      .replace(/[.,#]/g, "");

  if (expandAbbr(normApp) === expandAbbr(normLabel)) {
    return {
      status: "smart_match",
      confidence: 0.93,
      notes: "Abbreviation differences only",
    };
  }

  const ratio = similarity(normApp, normLabel);
  if (ratio > 0.85) {
    return { status: "smart_match", confidence: ratio, notes: `${Math.round(ratio * 100)}% match` };
  }
  if (ratio > 0.65) {
    return {
      status: "warning",
      confidence: ratio,
      notes: `Possible match — manual review needed (${Math.round(ratio * 100)}% similar)`,
    };
  }

  return {
    status: "mismatch",
    confidence: ratio,
    notes: `Values differ: "${appValue}" vs "${labelValue}"`,
  };
}

export function governmentWarningMatch(warningAnalysis: {
  present: boolean;
  text?: string;
  headerIsAllCaps: boolean;
  headerIsBold: boolean;
  isTextExact: boolean;
  issues: string[];
}): MatchResult {
  if (!warningAnalysis.present) {
    return {
      status: "mismatch",
      confidence: 1,
      notes: "CRITICAL: Government Warning Statement is absent from label",
    };
  }

  const issues: string[] = [...warningAnalysis.issues];

  if (!warningAnalysis.headerIsAllCaps) {
    issues.push('"GOVERNMENT WARNING:" header must be in ALL CAPS');
  }
  if (!warningAnalysis.headerIsBold) {
    issues.push('"GOVERNMENT WARNING:" header must be bold/emphasized');
  }
  if (!warningAnalysis.isTextExact) {
    issues.push("Warning text is not word-for-word exact");
  }

  if (issues.length === 0) {
    return { status: "match", confidence: 1, notes: "Government warning is present and compliant" };
  }

  const isCritical =
    !warningAnalysis.isTextExact ||
    (!warningAnalysis.headerIsAllCaps && !warningAnalysis.headerIsBold);

  return {
    status: isCritical ? "mismatch" : "warning",
    confidence: 0.9,
    notes: issues.join("; "),
  };
}

function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  const editDistance = levenshtein(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export { GOVERNMENT_WARNING_TEXT };
