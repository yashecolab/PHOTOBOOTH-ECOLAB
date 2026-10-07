"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ImagePlus,
  LoaderCircle,
  Plus,
  RotateCcw,
  Save,
  ShieldAlert,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { TemplateCard } from "@/components/TemplateCard";
import { Toast } from "@/components/Toast";
import { deleteCustomFrame, resetBuiltInFrame, saveManagedFrame } from "@/lib/frame-storage";
import { useFrameTemplates } from "@/hooks/useFrameTemplates";
import type { Template } from "@/lib/types";

const MAX_FRAME_BYTES = 5 * 1024 * 1024;
const MAX_FRAME_PIXELS = 16_000_000;
const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
const DEFAULT_OVERLAY_LAYOUT = { x: 0, y: 0, width: 100 };

function createDraft(name = "New frame"): Template {
  return {
    id: "",
    name,
    eyebrow: "EDC MOMENTS",
    title: "Better together",
    subtitle: "ECOLAB DIGITAL CENTER",
    footer: "#EDCMoments",
    tags: ["Custom"],
    color: "#075ca8",
    accent: "#00a3e0",
    background: "#f4f9ff",
    enabled: true
  };
}

async function validatePng(file: File): Promise<void> {
  if (file.size > MAX_FRAME_BYTES) throw new Error("Choose a PNG smaller than 5 MB.");
  const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (!pngSignature.every((byte, index) => signature[index] === byte)) {
    throw new Error("This file doesn’t have a valid PNG image signature.");
  }
  const image = await createImageBitmap(file);
  try {
    if (image.width * image.height > MAX_FRAME_PIXELS || image.width > 8000 || image.height > 8000) {
      throw new Error("This PNG is too large to use as a frame. Keep it under 16 megapixels.");
    }
  } finally {
    image.close();
  }
}

export function AdminFramesExperience() {
  const { frames, loading, error: storageError } = useFrameTemplates();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Template>(() => createDraft());
  const [tagInput, setTagInput] = useState("Custom");
  const [overlayFile, setOverlayFile] = useState<File | null>(null);
  const [removeOverlay, setRemoveOverlay] = useState(false);
  const [uploadPreview, setUploadPreview] = useState("");
  const overlayPreviewRef = useRef<HTMLDivElement>(null);
  const overlayDrag = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");

  const editingFrame = useMemo(
    () => frames.find((frame) => frame.id === editingId),
    [editingId, frames]
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!overlayFile) {
      setUploadPreview("");
      return;
    }
    const url = URL.createObjectURL(overlayFile);
    setUploadPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [overlayFile]);

  function startNewFrame() {
    setEditingId(null);
    setDraft(createDraft());
    setTagInput("Custom");
    setOverlayFile(null);
    setRemoveOverlay(false);
    setFormError("");
  }

  function startEditing(frame: Template) {
    setEditingId(frame.id);
    setDraft({ ...frame, tags: [...frame.tags] });
    setTagInput(frame.tags.join(", "));
    setOverlayFile(null);
    setRemoveOverlay(false);
    setFormError("");
  }

  function updateDraft(field: keyof Template, value: string | boolean) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateOverlayLayout(change: Partial<NonNullable<Template["overlayLayout"]>>) {
    setDraft((current) => ({
      ...current,
      overlayLayout: { ...DEFAULT_OVERLAY_LAYOUT, ...current.overlayLayout, ...change }
    }));
  }

  function beginOverlayDrag(event: React.PointerEvent<HTMLImageElement>) {
    const layout = draft.overlayLayout ?? DEFAULT_OVERLAY_LAYOUT;
    overlayDrag.current = { startX: event.clientX, startY: event.clientY, x: layout.x, y: layout.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveOverlay(event: React.PointerEvent<HTMLImageElement>) {
    const drag = overlayDrag.current;
    const stage = overlayPreviewRef.current;
    if (!drag || !stage) return;

    const bounds = stage.getBoundingClientRect();
    const imageBounds = event.currentTarget.getBoundingClientRect();
    const minX = Math.min(0, ((bounds.width * 0.1 - imageBounds.width) / bounds.width) * 100);
    const minY = Math.min(0, ((bounds.height * 0.1 - imageBounds.height) / bounds.height) * 100);
    const x = Math.max(minX, Math.min(90, drag.x + ((event.clientX - drag.startX) / bounds.width) * 100));
    const y = Math.max(minY, Math.min(90, drag.y + ((event.clientY - drag.startY) / bounds.height) * 100));
    updateOverlayLayout({ x, y });
  }

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    setFormError("");
    try {
      await validatePng(file);
      setOverlayFile(file);
      setRemoveOverlay(false);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "This PNG could not be used.");
    }
  }

  async function saveFrame(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const tags = tagInput.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 8);
    if (!draft.name.trim() || !draft.eyebrow.trim() || !draft.title.trim() || !draft.footer.trim()) {
      setFormError("Add a frame name, header, title, and footer before saving.");
      return;
    }
    if (tags.length === 0) {
      setFormError("Add at least one tag to help people find this frame.");
      return;
    }

    const template: Template = {
      ...draft,
      id: editingId ?? `custom-${crypto.randomUUID()}`,
      name: draft.name.trim(),
      eyebrow: draft.eyebrow.trim(),
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim(),
      footer: draft.footer.trim(),
      tags,
      ...(currentOverlay
        ? { overlayLayout: draft.overlayLayout ?? DEFAULT_OVERLAY_LAYOUT }
        : {}),
      enabled: draft.enabled !== false
    };

    setSaving(true);
    try {
      await saveManagedFrame(
        template,
        overlayFile ?? (removeOverlay ? null : undefined)
      );
      setToast(editingId ? "Frame changes saved on this device." : "Frame added on this device.");
      startNewFrame();
    } catch (cause) {
      console.error("Could not save frame changes.", cause);
      setFormError(cause instanceof Error ? cause.message : "The frame could not be saved. Check available browser storage.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleFrame(frame: Template) {
    if (frame.enabled && frames.filter((item) => item.enabled).length <= 1) {
      setToast("Keep at least one frame available in the booth.");
      return;
    }
    try {
      await saveManagedFrame({ ...frame, enabled: frame.enabled === false });
      setToast(`${frame.name} ${frame.enabled === false ? "is now available" : "has been hidden"} in the booth.`);
    } catch (cause) {
      console.error("Could not change frame visibility.", cause);
      setToast(cause instanceof Error ? cause.message : "Frame visibility could not be changed.");
    }
  }

  async function restoreFrame(frame: Template) {
    if (!window.confirm(`Restore “${frame.name}” to its original design?`)) return;
    try {
      await resetBuiltInFrame(frame.id);
      if (editingId === frame.id) startNewFrame();
      setToast(`${frame.name} has been restored.`);
    } catch (cause) {
      console.error("Could not restore the built-in frame.", cause);
      setToast(cause instanceof Error ? cause.message : "The frame could not be restored.");
    }
  }

  async function removeFrame(frame: Template) {
    if (frame.builtIn || !window.confirm(`Delete the custom frame “${frame.name}”?`)) return;
    try {
      await deleteCustomFrame(frame.id);
      if (editingId === frame.id) startNewFrame();
      setToast(`${frame.name} has been deleted from this device.`);
    } catch (cause) {
      console.error("Could not delete the custom frame.", cause);
      setToast(cause instanceof Error ? cause.message : "The frame could not be deleted.");
    }
  }

  const currentOverlay = uploadPreview || (!removeOverlay ? draft.overlayUrl : "");

  return (
    <div className="page-wrap admin-page">
      <header className="page-heading">
        <span className="section-kicker">Frame studio</span>
        <h1>Manage your frames.</h1>
        <p>Create event-ready designs and choose which frames appear in the photo booth.</p>
      </header>

      <aside className="admin-local-notice" role="note">
        <ShieldAlert size={19} aria-hidden="true" />
        <p><strong>Local frame editor</strong> Changes and uploaded artwork stay in this browser only. This page has no sign-in and is not a protected admin console.</p>
      </aside>
      {storageError && <p className="admin-error" role="alert">{storageError} Built-in frames remain available, but local edits may not work.</p>}

      <div className="admin-layout">
        <section className="admin-frame-list" aria-labelledby="admin-frame-list-heading">
          <div className="admin-list-heading">
            <div>
              <h2 id="admin-frame-list-heading">Available frames</h2>
              <p>{frames.filter((frame) => frame.enabled).length} visible in the booth</p>
            </div>
            <button className="button button-primary" type="button" onClick={startNewFrame}>
              <Plus size={15} /> New frame
            </button>
          </div>
          {loading && <p className="admin-loading"><LoaderCircle className="animate-spin" size={16} /> Loading device frames…</p>}
          <div className="admin-frame-grid">
            {frames.map((frame) => (
              <article className={`admin-frame-item${editingId === frame.id ? " selected" : ""}`} key={frame.id}>
                <TemplateCard template={frame} />
                <div className="admin-frame-meta">
                  <span className={`admin-status${frame.enabled ? "" : " inactive"}`}>{frame.enabled ? "Available" : "Hidden"}</span>
                  <span className="tag">{frame.builtIn ? "Built-in" : "Custom"}</span>
                </div>
                <div className="admin-frame-actions">
                  <button type="button" className="button button-secondary" onClick={() => startEditing(frame)} aria-label={`Edit ${frame.name}`}>
                    <ImagePlus size={13} /> Edit
                  </button>
                  <button type="button" className="admin-icon-button" onClick={() => void toggleFrame(frame)} aria-label={`${frame.enabled ? "Hide" : "Show"} ${frame.name}`}>
                    {frame.enabled ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  {frame.builtIn ? (
                    <button type="button" className="admin-icon-button" onClick={() => void restoreFrame(frame)} aria-label={`Restore ${frame.name} defaults`} title="Restore built-in defaults">
                      <RotateCcw size={14} />
                    </button>
                  ) : (
                    <button type="button" className="admin-icon-button danger" onClick={() => void removeFrame(frame)} aria-label={`Delete ${frame.name}`}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-editor" aria-labelledby="frame-editor-heading">
          <div className="admin-list-heading">
            <div>
              <h2 id="frame-editor-heading">{editingId ? "Edit frame" : "Create a frame"}</h2>
              <p>Fine-tune the copy and upload a transparent PNG overlay.</p>
            </div>
            {editingId && <button type="button" className="admin-icon-button" aria-label="Start a new frame" onClick={startNewFrame}><X size={16} /></button>}
          </div>

          <form className="admin-form" onSubmit={(event) => void saveFrame(event)}>
            <label className="admin-field">
              Frame name
              <input maxLength={50} required value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} />
            </label>
            <label className="admin-field">
              Header label
              <input maxLength={60} required value={draft.eyebrow} onChange={(event) => updateDraft("eyebrow", event.target.value)} />
            </label>
            <label className="admin-field">
              Main title
              <input maxLength={70} required value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} />
            </label>
            <label className="admin-field">
              Subtitle
              <input maxLength={70} value={draft.subtitle} onChange={(event) => updateDraft("subtitle", event.target.value)} />
            </label>
            <label className="admin-field">
              Footer
              <input maxLength={70} required value={draft.footer} onChange={(event) => updateDraft("footer", event.target.value)} />
            </label>
            <label className="admin-field">
              Tags <span>Separate with commas</span>
              <input maxLength={100} value={tagInput} onChange={(event) => setTagInput(event.target.value)} />
            </label>
            <div className="admin-color-fields">
              <label className="admin-field">Text color<input type="color" value={draft.color} onChange={(event) => updateDraft("color", event.target.value)} /></label>
              <label className="admin-field">Accent color<input type="color" value={draft.accent} onChange={(event) => updateDraft("accent", event.target.value)} /></label>
              <label className="admin-field">Background<input type="color" value={draft.background} onChange={(event) => updateDraft("background", event.target.value)} /></label>
            </div>

            <div className="admin-upload">
              <div className="admin-upload-label">
                <strong>Transparent PNG overlay</strong>
                <span>Up to 5 MB · drag to position it on the strip</span>
              </div>
              <label className="button button-secondary admin-upload-button">
                <Upload size={14} /> Choose PNG
                <input className="sr-only" type="file" accept="image/png,.png" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void handleUpload(file); }} />
              </label>
              {currentOverlay && (
                <div className="admin-overlay-preview">
                  <div
                    className="admin-overlay-stage"
                    ref={overlayPreviewRef}
                    style={{
                      "--template-bg": draft.background,
                      "--template-color": draft.color,
                      "--template-accent": draft.accent
                    } as React.CSSProperties}
                    aria-label="Strip preview with draggable PNG overlay"
                  >
                    <div className="admin-overlay-strip">
                      <strong>{draft.eyebrow || "FRAME HEADER"}</strong>
                      <b>{draft.title || "Frame title"}</b>
                      <div className="admin-overlay-photos"><i /><i /><i /><i /></div>
                      <small>{draft.footer || "Frame footer"}</small>
                    </div>
                    <img
                      src={currentOverlay}
                      alt="Transparent PNG overlay. Drag to reposition."
                      draggable={false}
                      onPointerDown={beginOverlayDrag}
                      onPointerMove={moveOverlay}
                      onPointerUp={() => { overlayDrag.current = null; }}
                      onPointerCancel={() => { overlayDrag.current = null; }}
                      style={{
                        left: `${draft.overlayLayout?.x ?? DEFAULT_OVERLAY_LAYOUT.x}%`,
                        top: `${draft.overlayLayout?.y ?? DEFAULT_OVERLAY_LAYOUT.y}%`,
                        width: `${draft.overlayLayout?.width ?? DEFAULT_OVERLAY_LAYOUT.width}%`,
                        right: "auto",
                        bottom: "auto"
                      }}
                    />
                  </div>
                  <button
                    className="admin-icon-button danger"
                    type="button"
                    onClick={() => { setOverlayFile(null); setRemoveOverlay(true); setFormError(""); }}
                    aria-label="Remove frame overlay"
                  >
                    <X size={14} />
                  </button>
                  <label className="admin-overlay-size">
                    PNG width: {Math.round(draft.overlayLayout?.width ?? DEFAULT_OVERLAY_LAYOUT.width)}%
                    <input
                      type="range"
                      min="20"
                      max="100"
                      step="1"
                      value={draft.overlayLayout?.width ?? DEFAULT_OVERLAY_LAYOUT.width}
                      onChange={(event) => updateOverlayLayout({ width: Number(event.target.value) })}
                    />
                  </label>
                </div>
              )}
            </div>
            {editingFrame?.builtIn && <p className="admin-help">Built-in frames can be customized or restored, but not permanently deleted.</p>}
            {!editingId && <label className="admin-checkbox"><input type="checkbox" checked={draft.enabled !== false} onChange={(event) => updateDraft("enabled", event.target.checked)} /> Show this frame in the booth</label>}
            {formError && <p className="admin-error" role="alert">{formError}</p>}
            <div className="admin-form-actions">
              <button type="submit" className="button button-primary" disabled={saving}>
                {saving ? <LoaderCircle className="animate-spin" size={15} /> : editingId ? <Save size={15} /> : <Plus size={15} />}
                {saving ? "Saving…" : editingId ? "Save changes" : "Create frame"}
              </button>
              {editingId && <button type="button" className="button button-secondary" onClick={startNewFrame}><Plus size={14} /> New instead</button>}
            </div>
          </form>
          <Link href="/booth" className="admin-back-link"><ArrowLeft size={14} /> Back to the photo booth</Link>
        </section>
      </div>
      <Toast message={toast} onDismiss={() => setToast("")} />
    </div>
  );
}
