// app/api/nodes/route.ts
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

export async function GET() {
  return NextResponse.json(readNodes());
}

export async function POST(req: Request) {
  const { name, description } = await req.json();
  const nodes = readNodes();

  const newNode = {
    id: nodes.length ? nodes[nodes.length - 1].id + 1 : 1, // keep numbers for now
    name,
    description,
    actions: [],             // <- ready for puppeteer steps later
    status: "idle",          // "idle" | "running" | "failed" | "completed"
    lastRun: null as string | null,
  };

  nodes.push(newNode);
  saveNodes(nodes);
  return NextResponse.json(newNode, { status: 201 });
}