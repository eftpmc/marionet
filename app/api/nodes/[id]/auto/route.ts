import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "nodes.json");

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify([]));
}

function readNodes() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
}

function saveNodes(nodes: any[]) {
  ensureDataFile();
  fs.writeFileSync(dataFile, JSON.stringify(nodes, null, 2));
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const nodeId = parseInt(id, 10);

  const body = await req.json();
  const { enabled, intervalMs } = body;

  const nodes = readNodes();
  const node = nodes.find((n: any) => n.id === nodeId);
  if (!node) {
    return NextResponse.json({ error: "Node not found" }, { status: 404 });
  }

  node.autoRunEnabled = Boolean(enabled);
  if (typeof intervalMs === "number" && intervalMs > 0) {
    node.intervalMs = intervalMs;
  }

  saveNodes(nodes);

  return NextResponse.json({
    success: true,
    autoRunEnabled: node.autoRunEnabled,
    intervalMs: node.intervalMs || 60_000,
  });
}