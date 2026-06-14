export type BeverageType = "distilled_spirits" | "wine" | "malt_beverage";

export type ReviewStatus =
  | "pending"
  | "analyzing"
  | "approved"
  | "flagged"
  | "rejected";

export type FieldStatus =
  | "match"
  | "smart_match"
  | "mismatch"
  | "missing"
  | "not_required"
  | "warning";

export interface ApplicationData {
  applicantName: string;
  brandName: string;
  beverageType: BeverageType;
  classTypeDesignation: string;
  alcoholContent: string;
  netContents: string;
  bottlerName: string;
  bottlerAddress: string;
  countryOfOrigin: string;
  vintageDate?: string;
  sulfiteDeclaration?: string;
  hasGovernmentWarning: boolean;
  additionalInfo?: string;
}

export interface GovernmentWarningAnalysis {
  present: boolean;
  text?: string;
  headerIsAllCaps: boolean;
  headerIsBold: boolean;
  isTextExact: boolean;
  issues: string[];
}

export interface ExtractedLabelData {
  brandName?: string;
  classTypeDesignation?: string;
  alcoholContent?: string;
  netContents?: string;
  bottlerName?: string;
  bottlerAddress?: string;
  countryOfOrigin?: string;
  vintageDate?: string;
  sulfiteDeclaration?: string;
  governmentWarning: GovernmentWarningAnalysis;
  imageQuality: {
    score: number;
    issues: string[];
    affectsAnalysis: boolean;
  };
  confidence: number;
  additionalObservations?: string;
}

export interface FieldComparison {
  field: string;
  label: string;
  applicationValue: string;
  labelValue: string;
  status: FieldStatus;
  confidence: number;
  notes?: string;
  required: boolean;
}

export interface ReviewResult {
  overallStatus: ReviewStatus;
  fields: FieldComparison[];
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
  governmentWarningDetails: GovernmentWarningAnalysis;
  imageQualityScore: number;
  imageQualityIssues: string[];
  analysisTimestamp: string;
  agentNotes?: string;
}

export interface Application {
  id: string;
  applicationData: ApplicationData;
  imageData?: string;
  imageName?: string;
  imageType?: string;
  status: ReviewStatus;
  reviewResult?: ReviewResult;
  extractedData?: ExtractedLabelData;
  createdAt: string;
  updatedAt: string;
  batchId?: string;
}

export interface BatchJob {
  id: string;
  totalCount: number;
  processedCount: number;
  approvedCount: number;
  flaggedCount: number;
  rejectedCount: number;
  status: "processing" | "complete" | "error";
  applicationIds: string[];
  createdAt: string;
  completedAt?: string;
}
