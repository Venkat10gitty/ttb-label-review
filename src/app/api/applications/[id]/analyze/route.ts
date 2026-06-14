import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { extractLabelData, buildReviewResult } from "@/lib/label-analyzer";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const app = store.applications.get(params.id);
  if (!app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (!app.imageData) {
    return NextResponse.json(
      { error: "No label image attached to this application" },
      { status: 400 }
    );
  }

  store.applications.set({
    ...app,
    status: "analyzing",
    updatedAt: new Date().toISOString(),
  });

  try {
    const mediaType = (app.imageType ?? "image/jpeg") as
      | "image/jpeg"
      | "image/png"
      | "image/webp"
      | "image/gif";

    const extracted = await extractLabelData(app.imageData, mediaType);
    const reviewResult = buildReviewResult(app.applicationData, extracted);

    const updated = {
      ...app,
      status: reviewResult.overallStatus,
      extractedData: extracted,
      reviewResult,
      updatedAt: new Date().toISOString(),
    };

    store.applications.set(updated);
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Analysis error:", err);

    store.applications.set({
      ...app,
      status: "pending",
      updatedAt: new Date().toISOString(),
    });

    const message = err instanceof Error ? err.message : String(err);
    let userError = "Analysis failed. Please try again.";
    if (message.includes("credit balance") || message.includes("too low")) {
      userError = "Insufficient API credits. Please add credits at console.anthropic.com/settings/billing and try again.";
    } else if (message.includes("401") || message.includes("authentication")) {
      userError = "Invalid API key. Please check your ANTHROPIC_API_KEY in .env.local.";
    } else if (message.includes("overloaded") || message.includes("529")) {
      userError = "Claude API is temporarily overloaded. Please wait a moment and try again.";
    }

    return NextResponse.json({ error: userError }, { status: 500 });
  }
}
