import Anthropic from "@anthropic-ai/sdk";
import type {
  ApplicationData,
  ExtractedLabelData,
  FieldComparison,
  ReviewResult,
  ReviewStatus,
} from "./types";
import {
  smartMatch,
  numericMatch,
  fuzzyMatch,
  governmentWarningMatch,
} from "./matching";
import { REQUIRED_FIELDS, GOVERNMENT_WARNING_TEXT } from "./ttb-rules";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXTRACTION_PROMPT = `You are a TTB (Alcohol and Tobacco Tax and Trade Bureau) label compliance specialist with expert knowledge of 27 CFR Parts 4, 5, and 7.

Analyze this alcohol beverage label image and extract ALL relevant information with extreme precision.

CRITICAL INSTRUCTIONS:
1. Extract text EXACTLY as it appears — preserve original capitalization, punctuation, and special characters
2. For the Government Warning, note if "GOVERNMENT WARNING:" appears in ALL CAPS and appears visually bold/emphasized
3. The required Government Warning text is: "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems."
4. Note any image quality issues that affect your ability to read the label accurately
5. If a field is not visible or not present, use null

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "brandName": "exact brand name as shown on label or null",
  "classTypeDesignation": "product class and type as shown (e.g., BOURBON WHISKEY) or null",
  "alcoholContent": "exact ABV text as shown (e.g., 40% ALC/VOL) or null",
  "netContents": "exact net contents as shown (e.g., 750 ML) or null",
  "bottlerName": "name of bottler, distiller, producer, brewer, or importer as shown or null",
  "bottlerAddress": "full address as shown or null",
  "countryOfOrigin": "country name if shown or null",
  "vintageDate": "vintage year if shown (wine) or null",
  "sulfiteDeclaration": "sulfite declaration text if shown or null",
  "governmentWarning": {
    "present": true or false,
    "headerIsAllCaps": true if GOVERNMENT WARNING: appears in all caps,
    "headerIsBold": true if the header appears bolder or more emphasized than surrounding text,
    "text": "the complete government warning text exactly as shown on label, or null",
    "isTextExact": true if text matches the required TTB warning word-for-word,
    "issues": ["array of specific issues found with the warning statement"]
  },
  "imageQuality": {
    "score": a number from 0 to 1 representing overall readability,
    "issues": ["list of quality issues: blur, glare, angle, partial occlusion, etc."],
    "affectsAnalysis": true if quality issues prevent confident extraction
  },
  "confidence": a number from 0 to 1 representing overall extraction confidence,
  "additionalObservations": "any other compliance-relevant observations or null"
}`;

export async function extractLabelData(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
): Promise<ExtractedLabelData> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Claude returned non-JSON response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    brandName: parsed.brandName ?? undefined,
    classTypeDesignation: parsed.classTypeDesignation ?? undefined,
    alcoholContent: parsed.alcoholContent ?? undefined,
    netContents: parsed.netContents ?? undefined,
    bottlerName: parsed.bottlerName ?? undefined,
    bottlerAddress: parsed.bottlerAddress ?? undefined,
    countryOfOrigin: parsed.countryOfOrigin ?? undefined,
    vintageDate: parsed.vintageDate ?? undefined,
    sulfiteDeclaration: parsed.sulfiteDeclaration ?? undefined,
    governmentWarning: {
      present: parsed.governmentWarning?.present ?? false,
      headerIsAllCaps: parsed.governmentWarning?.headerIsAllCaps ?? false,
      headerIsBold: parsed.governmentWarning?.headerIsBold ?? false,
      text: parsed.governmentWarning?.text ?? undefined,
      isTextExact: parsed.governmentWarning?.isTextExact ?? false,
      issues: parsed.governmentWarning?.issues ?? [],
    },
    imageQuality: {
      score: parsed.imageQuality?.score ?? 0.5,
      issues: parsed.imageQuality?.issues ?? [],
      affectsAnalysis: parsed.imageQuality?.affectsAnalysis ?? false,
    },
    confidence: parsed.confidence ?? 0.5,
    additionalObservations: parsed.additionalObservations ?? undefined,
  };
}

export function buildReviewResult(
  appData: ApplicationData,
  extracted: ExtractedLabelData
): ReviewResult {
  const fields = REQUIRED_FIELDS[appData.beverageType];
  const comparisons: FieldComparison[] = [];
  const criticalIssues: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  for (const fieldDef of fields) {
    if (fieldDef.key === "governmentWarning") {
      const result = governmentWarningMatch(extracted.governmentWarning);
      comparisons.push({
        field: fieldDef.key,
        label: fieldDef.label,
        applicationValue: appData.hasGovernmentWarning ? "Required (checked)" : "Not checked",
        labelValue: extracted.governmentWarning.present
          ? extracted.governmentWarning.text ?? "Present (text unreadable)"
          : "NOT FOUND",
        status: result.status,
        confidence: result.confidence,
        notes: result.notes,
        required: fieldDef.required,
      });

      if (result.status === "mismatch") {
        criticalIssues.push(`Government Warning: ${result.notes}`);
      } else if (result.status === "warning") {
        warnings.push(`Government Warning: ${result.notes}`);
      }
      continue;
    }

    const appValue = String(
      appData[fieldDef.key as keyof ApplicationData] ?? ""
    );
    const labelValue = String(
      extracted[fieldDef.key as keyof ExtractedLabelData] ?? ""
    );

    let result;
    switch (fieldDef.matchType) {
      case "numeric":
        result = numericMatch(
          appValue,
          labelValue,
          fieldDef.key === "alcoholContent" ? "abv" : "volume"
        );
        break;
      case "fuzzy":
        result = fuzzyMatch(appValue, labelValue);
        break;
      case "presence":
        result = {
          status: labelValue ? ("match" as const) : ("mismatch" as const),
          confidence: 1,
          notes: labelValue
            ? `Found: "${labelValue}"`
            : "Sulfite declaration not found on label",
        };
        break;
      default:
        result = smartMatch(appValue, labelValue);
    }

    if (fieldDef.required && result.status === "missing") {
      criticalIssues.push(`${fieldDef.label}: Required field not found on label`);
    } else if (fieldDef.required && result.status === "mismatch") {
      criticalIssues.push(`${fieldDef.label}: ${result.notes ?? "Mismatch detected"}`);
    } else if (result.status === "warning" || result.status === "smart_match") {
      warnings.push(`${fieldDef.label}: ${result.notes ?? "Needs manual review"}`);
    }

    comparisons.push({
      field: fieldDef.key,
      label: fieldDef.label,
      applicationValue: appValue || "—",
      labelValue: labelValue || "Not found",
      status: result.status,
      confidence: result.confidence,
      notes: result.notes,
      required: fieldDef.required,
    });
  }

  if (extracted.imageQuality.affectsAnalysis) {
    warnings.push(
      `Image quality issues may affect accuracy: ${extracted.imageQuality.issues.join(", ")}`
    );
    recommendations.push(
      "Consider requesting a higher-quality label image (better lighting, straight angle, no glare)"
    );
  }

  if (extracted.additionalObservations) {
    recommendations.push(extracted.additionalObservations);
  }

  const hasCritical = criticalIssues.length > 0;
  const hasWarnings = warnings.length > 0;

  let overallStatus: ReviewStatus;
  if (hasCritical) {
    overallStatus = "rejected";
  } else if (hasWarnings) {
    overallStatus = "flagged";
  } else {
    overallStatus = "approved";
  }

  return {
    overallStatus,
    fields: comparisons,
    criticalIssues,
    warnings,
    recommendations,
    governmentWarningDetails: extracted.governmentWarning,
    imageQualityScore: extracted.imageQuality.score,
    imageQualityIssues: extracted.imageQuality.issues,
    analysisTimestamp: new Date().toISOString(),
  };
}
