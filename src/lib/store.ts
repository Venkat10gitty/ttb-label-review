import type { Application, BatchJob } from "./types";

declare global {
  // eslint-disable-next-line no-var
  var __ttb_store: {
    applications: Map<string, Application>;
    batches: Map<string, BatchJob>;
  } | undefined;
}

function getStore() {
  if (!global.__ttb_store) {
    global.__ttb_store = {
      applications: new Map<string, Application>(),
      batches: new Map<string, BatchJob>(),
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
    },
    delete(id: string): boolean {
      return getStore().applications.delete(id);
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
    },
  },
};
