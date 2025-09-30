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

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const nodeId = parseInt(id, 10);

  const nodes = readNodes();
  const node = nodes.find((n: any) => n.id === nodeId);
  if (!node) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // backfill older nodes with defaults
  if (!node.actions) node.actions = [];
  if (!node.lastRun) node.lastRun = null;
  if (!node.status) node.status = "idle";

  return NextResponse.json(node);
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const nodeId = parseInt(id, 10);

  const updates = await req.json();
  const nodes = readNodes();
  const idx = nodes.findIndex((n: any) => n.id === nodeId);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  nodes[idx] = { ...nodes[idx], ...updates };
  if (!nodes[idx].actions) nodes[idx].actions = [];
  saveNodes(nodes);

  return NextResponse.json(nodes[idx]);
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const nodeId = parseInt(id, 10);

  const nodes = readNodes();
  const updated = nodes.filter((n: any) => n.id !== nodeId);
  saveNodes(updated);

  return NextResponse.json({ success: true });
}