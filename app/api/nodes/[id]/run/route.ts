// app/api/nodes/[id]/run/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import scheduler from "@/lib/scheduler"; // ← NEW
const { connect } = require("puppeteer-real-browser");

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

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const nodeId = parseInt(id, 10);

  const nodes = readNodes();
  const node = nodes.find((n: any) => n.id === nodeId);
  if (!node) return NextResponse.json({ error: "Node not found" }, { status: 404 });
  if (!node.actions) node.actions = [];

  if (node.status === "running") {
    return NextResponse.json({ error: "Already running" }, { status: 409 });
  }

  node.status = "running";
  saveNodes(nodes);

  const cookieFile = path.join(dataDir, `cookies-${nodeId}.json`);
  let cookies: any[] = [];
  if (fs.existsSync(cookieFile)) {
    try {
      cookies = JSON.parse(fs.readFileSync(cookieFile, "utf-8"));
    } catch {
      console.warn(`Failed to parse cookies file for node ${nodeId}`);
    }
  }

  const { browser, page } = await connect({
    headless: true,
    args: [],
    customConfig: {},
    turnstile: true,
    connectOption: {},
    disableXvfb: false,
    ignoreAllFlags: false,
  });

  const results: any[] = [];
  const screenshotPath = path.join(dataDir, `screenshot-${nodeId}.png`);

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    );

    await page.setCookie(...cookies);

    if (node.baseUrl) {
      await page.goto(node.baseUrl);
      results.push({ type: "baseUrl", url: node.baseUrl });
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: screenshotPath });
    }

    for (const action of node.actions) {
      switch (action.type) {
        case "goto":
          await page.goto(action.url);
          results.push({ type: "goto", url: action.url });
          await new Promise((r) => setTimeout(r, 2000));
          await page.screenshot({ path: screenshotPath });
          break;

        case "click":
          await page.click(action.selector);
          results.push({ type: "click", selector: action.selector });
          await new Promise((r) => setTimeout(r, 2000));
          await page.screenshot({ path: screenshotPath });
          break;

        case "type":
          await page.type(action.selector, action.value);
          results.push({ type: "type", selector: action.selector, value: action.value });
          break;

        case "waitForSelector":
          await page.waitForSelector(action.selector);
          results.push({ type: "waitForSelector", selector: action.selector });
          break;

        case "wait": {
          const min = parseInt(action.min, 10) || 1000;
          const max = parseInt(action.max, 10) || min;
          const duration = randomBetween(min, max);
          await new Promise((r) => setTimeout(r, duration));
          results.push({ type: "wait", duration });
          break;
        }

        default:
          results.push({ error: `Unknown action ${action.type}` });
      }
    }

    node.lastRun = new Date().toISOString();
    node.status = "success";
    saveNodes(nodes);
  } catch (err: any) {
    node.lastRun = new Date().toISOString();
    node.status = "error";
    saveNodes(nodes);

    try { await browser.close(); } catch {}
    scheduler.onRunFinished(nodeId);

    return NextResponse.json(
      { error: err?.message || "Execution failed", results },
      { status: 500 }
    );
  }

  try { await browser.close(); } catch {}
  scheduler.onRunFinished(nodeId);

  return NextResponse.json({
    success: true,
    results,
    lastRun: node.lastRun,
    status: node.status,
    screenshot: `screenshot-${nodeId}.png`,
  });
}