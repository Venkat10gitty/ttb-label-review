import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { store } from "@/lib/store";
import type { Application } from "@/lib/types";

const DEMO_APPLICATIONS: Omit<Application, "id" | "createdAt" | "updatedAt">[] = [
  {
    applicationData: {
      applicantName: "Old Tom Distillery LLC",
      brandName: "OLD TOM DISTILLERY",
      beverageType: "distilled_spirits",
      classTypeDesignation: "Kentucky Straight Bourbon Whiskey",
      alcoholContent: "45% Alc./Vol. (90 Proof)",
      netContents: "750 mL",
      bottlerName: "Old Tom Distillery, LLC",
      bottlerAddress: "1842 Barrel House Road, Bardstown, KY 40004",
      countryOfOrigin: "",
      hasGovernmentWarning: true,
    },
    imageName: "old-tom-label.jpg",
    imageType: "image/jpeg",
    status: "approved",
    extractedData: {
      brandName: "OLD TOM DISTILLERY",
      classTypeDesignation: "Kentucky Straight Bourbon Whiskey",
      alcoholContent: "45% Alc./Vol. (90 Proof)",
      netContents: "750 mL",
      bottlerName: "Old Tom Distillery, LLC",
      bottlerAddress: "1842 Barrel House Road, Bardstown, KY 40004",
      countryOfOrigin: undefined,
      governmentWarning: {
        present: true,
        headerIsAllCaps: true,
        headerIsBold: true,
        isTextExact: true,
        text: "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.",
        issues: [],
      },
      imageQuality: { score: 0.95, issues: [], affectsAnalysis: false },
      confidence: 0.97,
    },
    reviewResult: {
      overallStatus: "approved",
      fields: [
        { field: "brandName", label: "Brand Name", applicationValue: "OLD TOM DISTILLERY", labelValue: "OLD TOM DISTILLERY", status: "match", confidence: 1, required: true },
        { field: "classTypeDesignation", label: "Class/Type Designation", applicationValue: "Kentucky Straight Bourbon Whiskey", labelValue: "Kentucky Straight Bourbon Whiskey", status: "match", confidence: 1, required: true },
        { field: "alcoholContent", label: "Alcohol Content (ABV)", applicationValue: "45% Alc./Vol. (90 Proof)", labelValue: "45% Alc./Vol. (90 Proof)", status: "match", confidence: 0.99, notes: "Both read 45%", required: true },
        { field: "netContents", label: "Net Contents", applicationValue: "750 mL", labelValue: "750 mL", status: "match", confidence: 0.99, required: true },
        { field: "bottlerName", label: "Bottler/Producer Name", applicationValue: "Old Tom Distillery, LLC", labelValue: "Old Tom Distillery, LLC", status: "match", confidence: 1, required: true },
        { field: "bottlerAddress", label: "Bottler/Producer Address", applicationValue: "1842 Barrel House Road, Bardstown, KY 40004", labelValue: "1842 Barrel House Road, Bardstown, KY 40004", status: "match", confidence: 1, required: true },
        { field: "countryOfOrigin", label: "Country of Origin", applicationValue: "—", labelValue: "Not found", status: "not_required", confidence: 1, required: false },
        { field: "governmentWarning", label: "Government Warning Statement", applicationValue: "Required (checked)", labelValue: "GOVERNMENT WARNING: (1) According to the Surgeon General...", status: "match", confidence: 1, notes: "Government warning is present and compliant", required: true },
      ],
      criticalIssues: [],
      warnings: [],
      recommendations: [],
      governmentWarningDetails: { present: true, headerIsAllCaps: true, headerIsBold: true, isTextExact: true, text: "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.", issues: [] },
      imageQualityScore: 0.95,
      imageQualityIssues: [],
      analysisTimestamp: new Date(Date.now() - 3600000).toISOString(),
    },
  },
  {
    applicationData: {
      applicantName: "Stone's Throw Winery Inc.",
      brandName: "Stone's Throw",
      beverageType: "wine",
      classTypeDesignation: "Cabernet Sauvignon",
      alcoholContent: "13.5% Alc./Vol.",
      netContents: "750 mL",
      bottlerName: "Stone's Throw Winery, Inc.",
      bottlerAddress: "8800 Silverado Trail, Napa, CA 94558",
      countryOfOrigin: "",
      vintageDate: "2021",
      sulfiteDeclaration: "Contains Sulfites",
      hasGovernmentWarning: true,
    },
    imageName: "stones-throw-label.jpg",
    imageType: "image/jpeg",
    status: "flagged",
    extractedData: {
      brandName: "STONE'S THROW",
      classTypeDesignation: "Cabernet Sauvignon",
      alcoholContent: "13.5% Alc./Vol.",
      netContents: "750 mL",
      bottlerName: "Stone's Throw Winery, Inc.",
      bottlerAddress: "8800 Silverado Trail, Napa, CA 94558",
      vintageDate: "2021",
      sulfiteDeclaration: "Contains Sulfites",
      governmentWarning: {
        present: true,
        headerIsAllCaps: true,
        headerIsBold: false,
        isTextExact: true,
        text: "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.",
        issues: ["GOVERNMENT WARNING: header does not appear visually bold"],
      },
      imageQuality: { score: 0.88, issues: ["Slight label curvature on right edge"], affectsAnalysis: false },
      confidence: 0.91,
    },
    reviewResult: {
      overallStatus: "flagged",
      fields: [
        { field: "brandName", label: "Brand Name", applicationValue: "Stone's Throw", labelValue: "STONE'S THROW", status: "smart_match", confidence: 0.95, notes: "Case difference: \"Stone's Throw\" vs \"STONE'S THROW\" — likely the same", required: true },
        { field: "classTypeDesignation", label: "Class/Type Designation", applicationValue: "Cabernet Sauvignon", labelValue: "Cabernet Sauvignon", status: "match", confidence: 1, required: true },
        { field: "alcoholContent", label: "Alcohol Content (ABV)", applicationValue: "13.5% Alc./Vol.", labelValue: "13.5% Alc./Vol.", status: "match", confidence: 0.99, notes: "Both read 13.5%", required: true },
        { field: "netContents", label: "Net Contents", applicationValue: "750 mL", labelValue: "750 mL", status: "match", confidence: 0.99, required: true },
        { field: "bottlerName", label: "Bottler/Producer Name", applicationValue: "Stone's Throw Winery, Inc.", labelValue: "Stone's Throw Winery, Inc.", status: "match", confidence: 1, required: true },
        { field: "bottlerAddress", label: "Bottler/Producer Address", applicationValue: "8800 Silverado Trail, Napa, CA 94558", labelValue: "8800 Silverado Trail, Napa, CA 94558", status: "match", confidence: 1, required: true },
        { field: "vintageDate", label: "Vintage Date", applicationValue: "2021", labelValue: "2021", status: "match", confidence: 1, required: false },
        { field: "sulfiteDeclaration", label: "Sulfite Declaration", applicationValue: "Contains Sulfites", labelValue: "Contains Sulfites", status: "match", confidence: 1, notes: "Found: \"Contains Sulfites\"", required: true },
        { field: "governmentWarning", label: "Government Warning Statement", applicationValue: "Required (checked)", labelValue: "GOVERNMENT WARNING: (1) According to the Surgeon General...", status: "warning", confidence: 0.9, notes: '"GOVERNMENT WARNING:" header must be bold/emphasized', required: true },
      ],
      criticalIssues: [],
      warnings: [
        "Brand Name: Case difference: \"Stone's Throw\" vs \"STONE'S THROW\" — likely the same",
        "Government Warning: \"GOVERNMENT WARNING:\" header must be bold/emphasized",
      ],
      recommendations: ["Confirm brand name casing is intentional on label", "Verify GOVERNMENT WARNING: header weight meets minimum visibility requirements"],
      governmentWarningDetails: { present: true, headerIsAllCaps: true, headerIsBold: false, isTextExact: true, text: "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.", issues: ["GOVERNMENT WARNING: header does not appear visually bold"] },
      imageQualityScore: 0.88,
      imageQualityIssues: ["Slight label curvature on right edge"],
      analysisTimestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  },
  {
    applicationData: {
      applicantName: "Golden Coast Brewing Company",
      brandName: "GOLDEN COAST IPA",
      beverageType: "malt_beverage",
      classTypeDesignation: "India Pale Ale",
      alcoholContent: "6.5% Alc./Vol.",
      netContents: "355 mL",
      bottlerName: "Golden Coast Brewing Company",
      bottlerAddress: "4200 Pacific Coast Highway, San Diego, CA 92037",
      countryOfOrigin: "",
      hasGovernmentWarning: true,
    },
    imageName: "golden-coast-label.jpg",
    imageType: "image/jpeg",
    status: "rejected",
    extractedData: {
      brandName: "GOLDEN COAST IPA",
      classTypeDesignation: "India Pale Ale",
      alcoholContent: "7.2% Alc./Vol.",
      netContents: "355 mL",
      bottlerName: "Golden Coast Brewing Co.",
      bottlerAddress: "4200 Pacific Coast Highway, San Diego, CA 92037",
      governmentWarning: {
        present: false,
        headerIsAllCaps: false,
        headerIsBold: false,
        isTextExact: false,
        issues: ["Government Warning Statement not found on label"],
      },
      imageQuality: { score: 0.72, issues: ["Glare on upper-right portion of label", "Slight motion blur"], affectsAnalysis: true },
      confidence: 0.78,
    },
    reviewResult: {
      overallStatus: "rejected",
      fields: [
        { field: "brandName", label: "Brand Name", applicationValue: "GOLDEN COAST IPA", labelValue: "GOLDEN COAST IPA", status: "match", confidence: 1, required: true },
        { field: "classTypeDesignation", label: "Class/Type Designation", applicationValue: "India Pale Ale", labelValue: "India Pale Ale", status: "match", confidence: 1, required: true },
        { field: "netContents", label: "Net Contents", applicationValue: "355 mL", labelValue: "355 mL", status: "match", confidence: 0.99, required: true },
        { field: "bottlerName", label: "Brewer/Producer Name", applicationValue: "Golden Coast Brewing Company", labelValue: "Golden Coast Brewing Co.", status: "smart_match", confidence: 0.87, notes: "Abbreviation differences only", required: true },
        { field: "bottlerAddress", label: "Brewer/Producer Address", applicationValue: "4200 Pacific Coast Highway, San Diego, CA 92037", labelValue: "4200 Pacific Coast Highway, San Diego, CA 92037", status: "match", confidence: 1, required: true },
        { field: "alcoholContent", label: "Alcohol Content (ABV)", applicationValue: "6.5% Alc./Vol.", labelValue: "7.2% Alc./Vol.", status: "mismatch", confidence: 0.99, notes: "Application states 6.5% but label shows 7.2%", required: false },
        { field: "governmentWarning", label: "Government Warning Statement", applicationValue: "Required (checked)", labelValue: "NOT FOUND", status: "mismatch", confidence: 1, notes: "CRITICAL: Government Warning Statement is absent from label", required: true },
      ],
      criticalIssues: [
        "Alcohol Content (ABV): Application states 6.5% but label shows 7.2%",
        "Government Warning: CRITICAL: Government Warning Statement is absent from label",
      ],
      warnings: [
        "Image quality issues may affect accuracy: Glare on upper-right portion of label, Slight motion blur",
      ],
      recommendations: [
        "Consider requesting a higher-quality label image (better lighting, straight angle, no glare)",
        "Applicant must add mandatory Government Warning Statement before resubmission",
        "ABV discrepancy must be resolved — application and label must agree",
      ],
      governmentWarningDetails: { present: false, headerIsAllCaps: false, headerIsBold: false, isTextExact: false, issues: ["Government Warning Statement not found on label"] },
      imageQualityScore: 0.72,
      imageQualityIssues: ["Glare on upper-right portion of label", "Slight motion blur"],
      analysisTimestamp: new Date(Date.now() - 10800000).toISOString(),
    },
  },
  {
    applicationData: {
      applicantName: "Bordeaux Imports USA",
      brandName: "Château Margaux Reserve",
      beverageType: "wine",
      classTypeDesignation: "Red Bordeaux Wine",
      alcoholContent: "14% Alc./Vol.",
      netContents: "750 mL",
      bottlerName: "Château Margaux SAS",
      bottlerAddress: "33460 Margaux, France",
      countryOfOrigin: "France",
      vintageDate: "2019",
      sulfiteDeclaration: "Contains Sulfites",
      hasGovernmentWarning: true,
    },
    imageName: "chateau-margaux-label.jpg",
    imageType: "image/jpeg",
    status: "pending",
  },
];

export async function POST() {
  if (store.applications.count() > 0) {
    return NextResponse.json({ message: "Demo data already loaded", count: store.applications.count() });
  }

  const now = new Date();
  for (const demo of DEMO_APPLICATIONS) {
    const createdAt = new Date(now.getTime() - Math.random() * 86400000).toISOString();
    store.applications.set({
      ...demo,
      id: uuidv4(),
      createdAt,
      updatedAt: createdAt,
    });
  }

  return NextResponse.json({ message: "Demo data loaded", count: DEMO_APPLICATIONS.length });
}
