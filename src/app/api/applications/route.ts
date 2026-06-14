import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { store } from "@/lib/store";
import type { Application } from "@/lib/types";

export async function GET() {
  const apps = store.applications.getAll();
  return NextResponse.json(apps);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const applicationDataRaw = formData.get("applicationData");
    if (!applicationDataRaw || typeof applicationDataRaw !== "string") {
      return NextResponse.json({ error: "applicationData is required" }, { status: 400 });
    }

    const applicationData = JSON.parse(applicationDataRaw);

    const imageFile = formData.get("image") as File | null;
    let imageData: string | undefined;
    let imageName: string | undefined;
    let imageType: string | undefined;

    if (imageFile && imageFile.size > 0) {
      const buffer = await imageFile.arrayBuffer();
      imageData = Buffer.from(buffer).toString("base64");
      imageName = imageFile.name;
      imageType = imageFile.type || "image/jpeg";
    }

    const now = new Date().toISOString();
    const app: Application = {
      id: uuidv4(),
      applicationData,
      imageData,
      imageName,
      imageType,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    store.applications.set(app);
    return NextResponse.json(app, { status: 201 });
  } catch (err) {
    console.error("Error creating application:", err);
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
  }
}
