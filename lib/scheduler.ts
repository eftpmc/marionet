// lib/scheduler.ts
import * as fs from "fs";
import * as path from "path";
import { Node } from "@/types";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "nodes.json");

function ensureDataFile() {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify([]));
}

function readNodes(): Node[] {
    ensureDataFile();
    return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
}

function saveNodes(nodes: Node[]) {
    ensureDataFile();
    fs.writeFileSync(dataFile, JSON.stringify(nodes, null, 2));
}

// Self-call base URL (inside container)
const PORT = process.env.PORT || "3000";
// Let BASE_URL be override-able; otherwise use 127.0.0.1 (works in container)
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;

// A tiny in-memory scheduler
class NodeScheduler {
    private timers = new Map<number, NodeJS.Timeout>();

    init() {
        // Clear all existing timers
        for (const [id, t] of this.timers) {
            clearTimeout(t);
            this.timers.delete(id);
        }

        // Re-scan and schedule fresh
        const nodes = readNodes();
        nodes.forEach((n) => {
            if (n.autoRunEnabled && n.intervalMs && n.intervalMs > 0) {
                this.scheduleFromLastRun(n.id, n.intervalMs, n.lastRun || null);
            }
        });

        console.log(`[scheduler] Initialized. Timers: ${this.timers.size}`);
    }


    cancel(id: number) {
        const t = this.timers.get(id);
        if (t) {
            clearTimeout(t);
            this.timers.delete(id);
            console.log(`[scheduler] Cancelled timer for node ${id}`);
        }
    }

    /** Schedule next run based on lastRun + interval. If overdue, run soon (500ms). */
    scheduleFromLastRun(id: number, intervalMs: number, lastRun: string | null) {
        this.cancel(id);

        let delay = intervalMs;
        if (lastRun) {
            const last = new Date(lastRun).getTime();
            const elapsed = Date.now() - last;
            delay = Math.max(500, intervalMs - elapsed);
        }

        const timer = setTimeout(() => this.triggerRun(id), delay);
        this.timers.set(id, timer);
        console.log(`[scheduler] Scheduled node ${id} in ${Math.round(delay)}ms`);
    }

    /** Force schedule next run intervalMs from now. */
    scheduleFromNow(id: number, intervalMs: number) {
        this.cancel(id);
        const timer = setTimeout(() => this.triggerRun(id), Math.max(500, intervalMs));
        this.timers.set(id, timer);
        console.log(`[scheduler] Scheduled node ${id} from now in ${intervalMs}ms`);
    }

    /** Called by the run route when a run completes successfully or not. */
    onRunFinished(id: number) {
        const nodes = readNodes();
        const node = nodes.find((n) => n.id === id);
        if (!node) return;
        if (node.autoRunEnabled && node.intervalMs && node.intervalMs > 0) {
            this.scheduleFromNow(id, node.intervalMs);
        } else {
            this.cancel(id);
        }
    }

    private async triggerRun(id: number) {
        try {
            console.log(`[scheduler] >>> RUN TRIGGERED for node ${id} at ${new Date().toISOString()} pid=${process.pid}`);

            const res = await fetch(`${BASE_URL}/api/nodes/${id}/run`, { method: "POST" });
            if (!res.ok) {
                const text = await res.text();
                console.error(`[scheduler] Run failed for node ${id}: ${res.status} ${text}`);
            } else {
                console.log(`[scheduler] Run finished for node ${id}`);
            }
        } catch (err) {
            console.error(`[scheduler] triggerRun error for node ${id}`, err);
            const nodes = readNodes();
            const node = nodes.find((n) => n.id === id);
            if (node?.autoRunEnabled && node.intervalMs) {
                this.scheduleFromNow(id, Math.min(node.intervalMs, 60_000));
            }
        }
    }
}

// Ensure singleton across imports
declare global {
    // eslint-disable-next-line no-var
    var __nodeScheduler: NodeScheduler | undefined;
}

const scheduler = global.__nodeScheduler ?? new NodeScheduler();
if (!global.__nodeScheduler) {
    global.__nodeScheduler = scheduler;
}

export default scheduler;