import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const nodeId = parseInt(id, 10);

  const formData = await req.formData();
  const file = formData.get("cookies") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const cookies = JSON.parse(await file.text());

  const cookieFile = path.join(dataDir, `cookies-${nodeId}.json`);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(cookieFile, JSON.stringify(cookies, null, 2));

  return NextResponse.json({ success: true });
}
