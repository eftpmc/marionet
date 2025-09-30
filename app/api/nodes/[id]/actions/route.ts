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

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const nodeId = parseInt(id, 10);

  const nodes = readNodes();
  const idx = nodes.findIndex((n: any) => n.id === nodeId);
  if (idx === -1) {
    return NextResponse.json({ error: "Node not found" }, { status: 404 });
  }

  const node = nodes[idx];
  if (!node.actions) node.actions = []; // backfill

  const action = await req.json();

  const newAction = {
    id: crypto.randomUUID(),
    ...action,
  };

  node.actions.push(newAction);
  saveNodes(nodes);

  return NextResponse.json(newAction, { status: 201 });
}