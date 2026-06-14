import type { BeverageType } from "./types";

export const GOVERNMENT_WARNING_TEXT =
  "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.";

export const GOVERNMENT_WARNING_HEADER = "GOVERNMENT WARNING:";

export interface RequiredField {
  key: string;
  label: string;
  required: boolean;
  matchType: "exact" | "smart" | "fuzzy" | "numeric" | "presence";
  description: string;
}

export const REQUIRED_FIELDS: Record<BeverageType, RequiredField[]> = {
  distilled_spirits: [
    {
      key: "brandName",
      label: "Brand Name",
      required: true,
      matchType: "smart",
      description: "Must match label exactly (case-insensitive, minor punctuation differences acceptable)",
    },
    {
      key: "classTypeDesignation",
      label: "Class/Type Designation",
      required: true,
      matchType: "smart",
      description: "e.g., BOURBON WHISKEY, VODKA, GIN",
    },
    {
      key: "alcoholContent",
      label: "Alcohol Content (ABV)",
      required: true,
      matchType: "numeric",
      description: "Numeric value must match; formatting variations acceptable",
    },
    {
      key: "netContents",
      label: "Net Contents",
      required: true,
      matchType: "numeric",
      description: "Volume must match; unit abbreviations acceptable",
    },
    {
      key: "bottlerName",
      label: "Bottler/Producer Name",
      required: true,
      matchType: "fuzzy",
      description: "Name of bottler, distiller, or importer",
    },
    {
      key: "bottlerAddress",
      label: "Bottler/Producer Address",
      required: true,
      matchType: "fuzzy",
      description: "Full address including city and state",
    },
    {
      key: "countryOfOrigin",
      label: "Country of Origin",
      required: false,
      matchType: "smart",
      description: "Required for imported products",
    },
    {
      key: "governmentWarning",
      label: "Government Warning Statement",
      required: true,
      matchType: "exact",
      description: "Must be exact word-for-word; GOVERNMENT WARNING: in all caps and bold",
    },
  ],
  wine: [
    {
      key: "brandName",
      label: "Brand Name",
      required: true,
      matchType: "smart",
      description: "Must match label exactly (case-insensitive)",
    },
    {
      key: "classTypeDesignation",
      label: "Class/Type Designation",
      required: true,
      matchType: "smart",
      description: "e.g., CABERNET SAUVIGNON, TABLE WINE",
    },
    {
      key: "alcoholContent",
      label: "Alcohol Content (ABV)",
      required: true,
      matchType: "numeric",
      description: "Required for wines >7% ABV",
    },
    {
      key: "netContents",
      label: "Net Contents",
      required: true,
      matchType: "numeric",
      description: "Volume must match",
    },
    {
      key: "bottlerName",
      label: "Bottler/Producer Name",
      required: true,
      matchType: "fuzzy",
      description: "Name of bottler or producer",
    },
    {
      key: "bottlerAddress",
      label: "Bottler/Producer Address",
      required: true,
      matchType: "fuzzy",
      description: "Full address",
    },
    {
      key: "countryOfOrigin",
      label: "Country of Origin",
      required: false,
      matchType: "smart",
      description: "Required for imported wines",
    },
    {
      key: "vintageDate",
      label: "Vintage Date",
      required: false,
      matchType: "exact",
      description: "Year must match exactly if declared",
    },
    {
      key: "sulfiteDeclaration",
      label: "Sulfite Declaration",
      required: true,
      matchType: "presence",
      description: "\"Contains Sulfites\" or similar required",
    },
    {
      key: "governmentWarning",
      label: "Government Warning Statement",
      required: true,
      matchType: "exact",
      description: "Must be exact word-for-word; GOVERNMENT WARNING: in all caps and bold",
    },
  ],
  malt_beverage: [
    {
      key: "brandName",
      label: "Brand Name",
      required: true,
      matchType: "smart",
      description: "Must match label exactly (case-insensitive)",
    },
    {
      key: "classTypeDesignation",
      label: "Class/Type Designation",
      required: true,
      matchType: "smart",
      description: "e.g., BEER, ALE, LAGER",
    },
    {
      key: "netContents",
      label: "Net Contents",
      required: true,
      matchType: "numeric",
      description: "Volume must match",
    },
    {
      key: "bottlerName",
      label: "Brewer/Producer Name",
      required: true,
      matchType: "fuzzy",
      description: "Name of brewer or producer",
    },
    {
      key: "bottlerAddress",
      label: "Brewer/Producer Address",
      required: true,
      matchType: "fuzzy",
      description: "Full address",
    },
    {
      key: "countryOfOrigin",
      label: "Country of Origin",
      required: false,
      matchType: "smart",
      description: "Required for imported products",
    },
    {
      key: "alcoholContent",
      label: "Alcohol Content (ABV)",
      required: false,
      matchType: "numeric",
      description: "Optional but must be accurate if stated",
    },
    {
      key: "governmentWarning",
      label: "Government Warning Statement",
      required: true,
      matchType: "exact",
      description: "Must be exact word-for-word; GOVERNMENT WARNING: in all caps and bold",
    },
  ],
};

export const BEVERAGE_TYPE_LABELS: Record<BeverageType, string> = {
  distilled_spirits: "Distilled Spirits",
  wine: "Wine",
  malt_beverage: "Malt Beverage / Beer",
};
