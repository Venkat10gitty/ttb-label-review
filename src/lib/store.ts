import fs from "fs";
import path from "path";
import type { Application, BatchJob } from "./types";

// In production serverless environments (Vercel), use global memory.
// On persistent-process hosts (Railway, Render), back it with a JSON file
// so data survives hot-module reloads in dev.

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), ".data");
const APPS_FILE = path.join(DATA_DIR, "applications.json");
const BATCHES_FILE = path.join(DATA_DIR, "batches.json");

const IS_SERVERLESS = process.env.VERCEL === "1";

function ensureDir() {
  if (!IS_SERVERLESS && !fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readFile<T>(filePath: string): Map<string, T> {
  try {
    if (!IS_SERVERLESS && fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const entries: [string, T][] = JSON.parse(raw);
      return new Map(entries);
    }
  } catch {
    // corrupt file — start fresh
  }
  return new Map<string, T>();
}

function writeFile<T>(filePath: string, map: Map<string, T>) {
  if (IS_SERVERLESS) return;
  try {
    ensureDir();
    fs.writeFileSync(filePath, JSON.stringify(Array.from(map.entries())), "utf-8");
  } catch {
    // non-fatal in demo context
  }
}

// Global in-memory cache (shared within a process / warm serverless instance)
declare global {
  // eslint-disable-next-line no-var
  var __ttb_store:
    | {
        applications: Map<string, Application>;
        batches: Map<string, BatchJob>;
      }
    | undefined;
}

function getStore() {
  if (!global.__ttb_store) {
    global.__ttb_store = {
      applications: readFile<Application>(APPS_FILE),
      batches: readFile<BatchJob>(BATCHES_FILE),
    };
  }
  return global.__ttb_store;
}

export const store = {
  applications: {
    getAll(): Application[] {
      return Array.from(getStore().applications.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    get(id: string): Application | undefined {
      return getStore().applications.get(id);
    },
    set(app: Application): void {
      getStore().applications.set(app.id, app);
      writeFile(APPS_FILE, getStore().applications);
    },
    delete(id: string): boolean {
      const deleted = getStore().applications.delete(id);
      if (deleted) writeFile(APPS_FILE, getStore().applications);
      return deleted;
    },
    count(): number {
      return getStore().applications.size;
    },
  },
  batches: {
    get(id: string): BatchJob | undefined {
      return getStore().batches.get(id);
    },
    set(batch: BatchJob): void {
      getStore().batches.set(batch.id, batch);
      writeFile(BATCHES_FILE, getStore().batches);
    },
  },
};
