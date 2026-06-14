import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const app = store.applications.get(params.id);
  if (!app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  return NextResponse.json(app);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const app = store.applications.get(params.id);
  if (!app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const body = await request.json();
  const updated = {
    ...app,
    ...body,
    id: app.id,
    updatedAt: new Date().toISOString(),
  };

  store.applications.set(updated);
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const existed = store.applications.delete(params.id);
  if (!existed) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
