import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { store } from "@/lib/store";
import { extractLabelData, buildReviewResult } from "@/lib/label-analyzer";
import type { Application, BatchJob } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const metadataRaw = formData.get("metadata");
    if (!metadataRaw || typeof metadataRaw !== "string") {
      return NextResponse.json({ error: "metadata is required" }, { status: 400 });
    }

    const metadata: Array<{ fileName: string; applicationData: Record<string, unknown> }> =
      JSON.parse(metadataRaw);

    const batchId = uuidv4();
    const applicationIds: string[] = [];
    const now = new Date().toISOString();

    const batch: BatchJob = {
      id: batchId,
      totalCount: metadata.length,
      processedCount: 0,
      approvedCount: 0,
      flaggedCount: 0,
      rejectedCount: 0,
      status: "processing",
      applicationIds: [],
      createdAt: now,
    };
    store.batches.set(batch);

    for (const item of metadata) {
      const imageFile = formData.get(`image_${item.fileName}`) as File | null;
      let imageData: string | undefined;
      let imageName: string | undefined;
      let imageType: string | undefined;

      if (imageFile && imageFile.size > 0) {
        const buffer = await imageFile.arrayBuffer();
        imageData = Buffer.from(buffer).toString("base64");
        imageName = imageFile.name;
        imageType = imageFile.type || "image/jpeg";
      }

      const app: Application = {
        id: uuidv4(),
        applicationData: item.applicationData as unknown as Application["applicationData"],
        imageData,
        imageName,
        imageType,
        status: "pending",
        createdAt: now,
        updatedAt: now,
        batchId,
      };

      store.applications.set(app);
      applicationIds.push(app.id);
    }

    batch.applicationIds = applicationIds;
    store.batches.set(batch);

    processBatchAsync(batchId, applicationIds);

    return NextResponse.json({ batchId, applicationIds, totalCount: metadata.length }, { status: 202 });
  } catch (err) {
    console.error("Batch creation error:", err);
    return NextResponse.json({ error: "Failed to create batch" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const batchId = url.searchParams.get("batchId");

  if (batchId) {
    const batch = store.batches.get(batchId);
    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }
    const apps = batch.applicationIds.map((id) => store.applications.get(id)).filter(Boolean);
    return NextResponse.json({ batch, applications: apps });
  }

  return NextResponse.json({ error: "batchId required" }, { status: 400 });
}

async function processBatchAsync(batchId: string, applicationIds: string[]) {
  const batch = store.batches.get(batchId);
  if (!batch) return;

  const CONCURRENCY = 3;

  async function processOne(id: string) {
    const app = store.applications.get(id);
    if (!app || !app.imageData) {
      const current = store.batches.get(batchId)!;
      store.batches.set({ ...current, processedCount: current.processedCount + 1 });
      return;
    }

    store.applications.set({ ...app, status: "analyzing", updatedAt: new Date().toISOString() });

    try {
      const mediaType = (app.imageType ?? "image/jpeg") as
        | "image/jpeg"
        | "image/png"
        | "image/webp"
        | "image/gif";
      const extracted = await extractLabelData(app.imageData, mediaType);
      const reviewResult = buildReviewResult(app.applicationData, extracted);

      store.applications.set({
        ...app,
        status: reviewResult.overallStatus,
        extractedData: extracted,
        reviewResult,
        updatedAt: new Date().toISOString(),
      });

      const current = store.batches.get(batchId)!;
      store.batches.set({
        ...current,
        processedCount: current.processedCount + 1,
        approvedCount: reviewResult.overallStatus === "approved"
          ? current.approvedCount + 1
          : current.approvedCount,
        flaggedCount: reviewResult.overallStatus === "flagged"
          ? current.flaggedCount + 1
          : current.flaggedCount,
        rejectedCount: reviewResult.overallStatus === "rejected"
          ? current.rejectedCount + 1
          : current.rejectedCount,
      });
    } catch {
      store.applications.set({ ...app, status: "pending", updatedAt: new Date().toISOString() });
      const current = store.batches.get(batchId)!;
      store.batches.set({ ...current, processedCount: current.processedCount + 1 });
    }
  }

  for (let i = 0; i < applicationIds.length; i += CONCURRENCY) {
    const chunk = applicationIds.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(processOne));
  }

  const final = store.batches.get(batchId)!;
  store.batches.set({ ...final, status: "complete", completedAt: new Date().toISOString() });
}
