"use client";

import { useEffect, useState } from "react";
import { templates as builtInTemplates } from "@/lib/data";
import { readManagedFrames, subscribeFrameChanges } from "@/lib/frame-storage";
import type { Template } from "@/lib/types";

export type ManagedTemplate = Template & { builtIn: boolean; enabled: boolean };

export function useFrameTemplates() {
  const [frames, setFrames] = useState<ManagedTemplate[]>(() =>
    builtInTemplates.map((template) => ({ ...template, builtIn: true, enabled: true }))
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let refreshVersion = 0;
    let objectUrls: string[] = [];

    async function refreshFrames() {
      const version = ++refreshVersion;
      try {
        const stored = await readManagedFrames();
        const storedById = new Map(stored.map((frame) => [frame.id, frame]));
        const nextObjectUrls: string[] = [];
        const makeFrame = (template: Template, builtIn: boolean): ManagedTemplate => {
          const saved = storedById.get(template.id);
          const merged = saved ? { ...template, ...saved.template } : template;
          const overlayUrl = saved?.overlay ? URL.createObjectURL(saved.overlay) : undefined;
          if (overlayUrl) nextObjectUrls.push(overlayUrl);
          return {
            ...merged,
            ...(overlayUrl ? { overlayUrl } : {}),
            builtIn,
            enabled: merged.enabled !== false
          };
        };

        const nextFrames = [
          ...builtInTemplates.map((template) => makeFrame(template, true)),
          ...stored
            .filter((frame) => !builtInTemplates.some((builtIn) => builtIn.id === frame.id))
            .map((frame) => makeFrame(frame.template, false))
        ];

        if (!active || version !== refreshVersion) {
          nextObjectUrls.forEach((url) => URL.revokeObjectURL(url));
          return;
        }
        objectUrls.forEach((url) => URL.revokeObjectURL(url));
        objectUrls = nextObjectUrls;
        setFrames(nextFrames);
        setError("");
      } catch (cause) {
        if (active) {
          console.error("Could not load locally managed frames.", cause);
          setError(cause instanceof Error ? cause.message : "Could not load local frames.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    const unsubscribe = subscribeFrameChanges(() => void refreshFrames());
    void refreshFrames();
    return () => {
      active = false;
      refreshVersion += 1;
      unsubscribe();
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  return { frames, loading, error };
}
