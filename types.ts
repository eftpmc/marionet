export type Action =
  | { id: number; type: "goto"; url: string }
  | { id: number; type: "click"; selector: string }
  | { id: number; type: "type"; selector: string; value: string }
  | { id: number; type: "waitForSelector"; selector: string }
  | { id: number; type: "wait"; min: number; max: number };

export type Node = {
  id: number;
  name: string;
  description: string;
  baseUrl?: string;
  actions?: Action[];
  lastRun?: string | null;
  status?: string;
  autoRunEnabled?: boolean;
  intervalMs?: number;
};
