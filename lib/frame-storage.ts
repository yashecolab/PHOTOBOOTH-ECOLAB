import { templates } from "@/lib/data";
import type { Template } from "@/lib/types";

const DATABASE_NAME = "edc-moments-frames";
const DATABASE_VERSION = 1;
const STORE_NAME = "frames";
const CHANGE_EVENT = "edc-moments-frames-change";
const CHANNEL_NAME = "edc-moments-frames";

type StoredTemplate = Omit<Template, "builtIn" | "overlayUrl">;

type StoredFrame = {
  id: string;
  template: StoredTemplate;
  overlay: Blob | null;
};

let databasePromise: Promise<IDBDatabase> | undefined;
let changeChannel: BroadcastChannel | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("This browser does not support local frame storage."));
  }
  if (databasePromise) return databasePromise;

  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => {
        request.result.close();
        databasePromise = undefined;
      };
      resolve(request.result);
    };
    request.onerror = () => reject(request.error ?? new Error("Could not open local frame storage."));
    request.onblocked = () => reject(new Error("Local frame storage is busy in another tab. Close other EDC Moments tabs and try again."));
  }).catch((error: unknown) => {
    databasePromise = undefined;
    throw error;
  });

  databasePromise = opening;
  return opening;
}

function storedTemplate(template: Template): StoredTemplate {
  return {
    id: template.id,
    name: template.name,
    eyebrow: template.eyebrow,
    title: template.title,
    subtitle: template.subtitle,
    footer: template.footer,
    tags: [...template.tags],
    color: template.color,
    accent: template.accent,
    background: template.background,
    enabled: template.enabled,
    ...(template.overlayLayout ? { overlayLayout: { ...template.overlayLayout } } : {})
  };
}

function notifyFrameChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
  if (typeof BroadcastChannel === "undefined") return;
  try {
    changeChannel ??= new BroadcastChannel(CHANNEL_NAME);
    changeChannel.postMessage("changed");
  } catch (error) {
    console.warn("Frame updates will only appear in this tab.", error);
  }
}

export function subscribeFrameChanges(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const onLocalChange = () => callback();
  const onMessage = () => callback();
  window.addEventListener(CHANGE_EVENT, onLocalChange);

  if (typeof BroadcastChannel !== "undefined") {
    try {
      changeChannel ??= new BroadcastChannel(CHANNEL_NAME);
      changeChannel.addEventListener("message", onMessage);
    } catch (error) {
      console.warn("Frame changes from other tabs cannot be synchronized.", error);
    }
  }

  return () => {
    window.removeEventListener(CHANGE_EVENT, onLocalChange);
    changeChannel?.removeEventListener("message", onMessage);
  };
}

export async function readManagedFrames(): Promise<StoredFrame[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).getAll();
    let result: StoredFrame[] | undefined;
    request.onsuccess = () => {
      result = request.result as StoredFrame[];
    };
    request.onerror = () => reject(request.error ?? new Error("Could not read saved frames."));
    transaction.oncomplete = () => {
      if (result) resolve(result);
      else reject(new Error("Frame storage returned no result."));
    };
    transaction.onabort = () => reject(transaction.error ?? new Error("Reading saved frames was interrupted."));
  });
}

export async function saveManagedFrame(template: Template, overlay?: Blob | null): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(template.id);
    request.onsuccess = () => {
      const existing = request.result as StoredFrame | undefined;
      const frame: StoredFrame = {
        id: template.id,
        template: storedTemplate(template),
        overlay: overlay === undefined ? existing?.overlay ?? null : overlay
      };
      store.put(frame);
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save this frame."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Saving this frame was interrupted."));
  });
  notifyFrameChange();
}

export async function deleteCustomFrame(id: string): Promise<void> {
  if (templates.some((template) => template.id === id)) {
    throw new Error("Built-in frames cannot be deleted. You can hide or reset them instead.");
  }
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not delete this frame."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Deleting this frame was interrupted."));
  });
  notifyFrameChange();
}

export async function resetBuiltInFrame(id: string): Promise<void> {
  if (!templates.some((template) => template.id === id)) {
    throw new Error("Only built-in frames can be restored to their defaults.");
  }
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not restore this frame."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Restoring this frame was interrupted."));
  });
  notifyFrameChange();
}
