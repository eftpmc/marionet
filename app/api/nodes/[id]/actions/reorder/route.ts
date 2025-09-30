import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "nodes.json");

function readNodes() {
  return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
}
function saveNodes(nodes: any[]) {
  fs.writeFileSync(dataFile, JSON.stringify(nodes, null, 2));
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const nodeId = parseInt(id, 10);

  const { actions } = await req.json();
  const nodes = readNodes();
  const idx = nodes.findIndex((n: any) => n.id === nodeId);

  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reordered = actions
    .map((id: number) => nodes[idx].actions.find((a: any) => a.id === id))
    .filter(Boolean);

  nodes[idx].actions = reordered;
  saveNodes(nodes);

  return NextResponse.json(reordered);
}
