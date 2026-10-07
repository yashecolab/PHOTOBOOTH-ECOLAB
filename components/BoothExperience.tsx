"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Download,
  Heart,
  ImagePlus,
  Lightbulb,
  LoaderCircle,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  X
} from "lucide-react";
import { usePhotobooth } from "@/hooks/usePhotobooth";
import { events, stickers, templates as builtInTemplates } from "@/lib/data";
import { useFrameTemplates } from "@/hooks/useFrameTemplates";
import { downloadElement, downloadPdf } from "@/lib/export";
import { readGallery, saveGallery } from "@/lib/storage";
import type { GalleryItem, TemplateId } from "@/lib/types";
import { TemplateCard } from "@/components/TemplateCard";
import { Toast } from "@/components/Toast";

const FabricStickerLayer = dynamic(
  () => import("@/components/FabricStickerLayer").then((module) => module.FabricStickerLayer),
  { ssr: false }
);

type Step = "template" | "camera" | "review" | "editor";

const categories = ["Technology", "Celebration", "Ecolab"];

function localDateInputValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export function BoothExperience() {
  const { frames } = useFrameTemplates();
  const availableFrames = useMemo(() => frames.filter((item) => item.enabled), [frames]);
  const [step, setStep] = useState<Step>("template");
  const [selectedId, setSelectedId] = useState<TemplateId>("ecolab");
  const [eventName, setEventName] = useState(events[0]);
  const [employeeName, setEmployeeName] = useState("");
  const [eventDate, setEventDate] = useState(localDateInputValue);
  const [stickerCategory, setStickerCategory] = useState("Technology");
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [cropPositions, setCropPositions] = useState<Array<{ x: number; y: number }>>(
    Array.from({ length: 4 }, () => ({ x: 50, y: 50 }))
  );
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState("");
  const [saved, setSaved] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const cropDrag = useRef<{ index: number; startX: number; startY: number; cropX: number; cropY: number } | null>(null);
  const {
    videoRef,
    cameraReady,
    permissionError,
    countdown,
    captured,
    capturing,
    flash,
    startCamera,
    captureFour,
    clearCaptured
  } = usePhotobooth();
  const template = availableFrames.find((item) => item.id === selectedId) ?? availableFrames[0] ?? builtInTemplates[0];

  useEffect(() => {
    if (availableFrames.length && !availableFrames.some((item) => item.id === selectedId)) {
      setSelectedId(availableFrames[0].id);
    }
  }, [availableFrames, selectedId]);

  useEffect(() => {
    if (toast) {
      const timer = window.setTimeout(() => setToast(""), 2800);
      return () => window.clearTimeout(timer);
    }
  }, [toast]);

  const photos = captured;
  const fabricLabels = useMemo(
    () => selectedStickers.flatMap((label) => {
      const sticker = stickers.find((item) => item.label === label);
      return sticker ? [{ label, glyph: sticker.glyph }] : [];
    }),
    [selectedStickers]
  );

  async function requestCamera() {
    const started = await startCamera();
    if (started) setToast("Camera ready — you’re all set.");
  }

  async function capture() {
    try {
      const result = await captureFour();
      if (result?.length === 4) {
        setStep("review");
      }
    } catch (error) {
      console.error("Photo capture failed.", error);
      setToast(error instanceof Error ? error.message : "We couldn’t finish the photo sequence. Please try again.");
    }
  }

  function retake() {
    clearCaptured();
    setCropPositions(Array.from({ length: 4 }, () => ({ x: 50, y: 50 })));
    setStep("camera");
    setSaved(false);
  }

  function beginCrop(index: number, event: React.PointerEvent<HTMLDivElement>) {
    cropDrag.current = {
      index,
      startX: event.clientX,
      startY: event.clientY,
      cropX: cropPositions[index]?.x ?? 50,
      cropY: cropPositions[index]?.y ?? 50
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveCrop(event: React.PointerEvent<HTMLDivElement>) {
    const drag = cropDrag.current;
    if (!drag) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, drag.cropX - ((event.clientX - drag.startX) / bounds.width) * 100));
    const y = Math.max(0, Math.min(100, drag.cropY - ((event.clientY - drag.startY) / bounds.height) * 100));
    setCropPositions((current) => current.map((position, index) => index === drag.index ? { x, y } : position));
  }

  function toggleSticker(label: string) {
    setSelectedStickers((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label]
    );
  }

  async function exportStrip(format: "png" | "jpg" | "pdf") {
    if (!stripRef.current) return;
    setBusy(format);
    try {
      const name = `edc-moments-${template.id}`;
      if (format === "pdf") await downloadPdf(stripRef.current, name);
      else await downloadElement(stripRef.current, format, name);
      setToast(`${format.toUpperCase()} download is ready.`);
    } catch (error) {
      console.error("Photo strip export failed.", error);
      setToast("The download could not be created. Please try again.");
    } finally {
      setBusy("");
    }
  }

  async function saveToGallery() {
    if (!stripRef.current || saved) return;
    setBusy("save");
    try {
      const { renderElement } = await import("@/lib/export");
      const canvas = await renderElement(stripRef.current);
      const item: GalleryItem = {
        id: crypto.randomUUID(),
        image: canvas.toDataURL("image/jpeg", 0.86),
        templateId: selectedId,
        eventName,
        employeeName: employeeName.trim(),
        createdAt: new Date().toISOString(),
        likes: 0,
        liked: false
      };
      saveGallery([item, ...readGallery()].slice(0, 60));
      setSaved(true);
      setToast("Saved to your on-device gallery.");
    } catch (error) {
      console.error("Saving photo strip failed.", error);
      setToast("Couldn’t save to this device. Its browser storage may be full.");
    } finally {
      setBusy("");
    }
  }

  async function shareStrip() {
    if (!stripRef.current) return;
    setBusy("share");
    try {
      const { renderElement } = await import("@/lib/export");
      const canvas = await renderElement(stripRef.current);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Could not create an image for sharing.")), "image/png");
      });
      const file = new File([blob], "edc-moments.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: "EDC Moments", text: "A little moment from Ecolab Digital Center." });
      } else {
        await downloadElement(stripRef.current, "png", "edc-moments");
        setToast("Your browser doesn’t support photo sharing, so we downloaded your strip instead.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Sharing photo strip failed.", error);
      setToast("Sharing isn’t available right now. Try downloading your strip.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="booth-page">
      <div className="page-wrap">
        <header className="page-heading">
          <span className="section-kicker">Your moment starts here</span>
          <h1>Let’s make a memory.</h1>
          <p>Pick a frame, bring your best smile, and leave with something worth keeping.</p>
        </header>
        <ol className="flow-steps" aria-label="Photobooth progress">
          {[
            { key: "template", label: "Choose frame" },
            { key: "camera", label: "Take photos" },
            { key: "review", label: "Review" },
            { key: "editor", label: "Make it yours" }
          ].map((item, index) => {
            const currentIndex = ["template", "camera", "review", "editor"].indexOf(step);
            return (
              <li className={`flow-step ${index === currentIndex ? "active" : index < currentIndex ? "done" : ""}`} key={item.key}>
                <span>{index < currentIndex ? <Check size={13} /> : index + 1}</span>{item.label}
                {index < 3 && <i className="flow-line" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>

        <AnimatePresence mode="wait">
          {step === "template" && (
            <motion.section key="template" className="booth-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} aria-labelledby="template-heading">
              <div className="panel-heading">
                <div><h2 id="template-heading">Choose your frame</h2><p>Pick the look that fits today’s occasion.</p></div>
                <span className="step-badge">STEP 01</span>
              </div>
              <div className="template-select-grid">
                {availableFrames.map((item) => <TemplateCard key={item.id} template={item} selectable selected={selectedId === item.id} onSelect={() => setSelectedId(item.id)} />)}
              </div>
              {!availableFrames.length && <p className="admin-error" role="status">No frames are currently available. Ask the local frame editor to show at least one.</p>}
              <div className="template-continue"><button className="button button-primary" type="button" disabled={!availableFrames.length} onClick={() => setStep("camera")}>Continue to camera <ArrowRight size={15} /></button></div>
            </motion.section>
          )}

          {step === "camera" && (
            <motion.section key="camera" className="booth-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} aria-labelledby="camera-heading">
              <div className="panel-heading">
                <div><h2 id="camera-heading">Get camera-ready</h2><p>Your camera is only used while you’re taking photos.</p></div>
                <span className="step-badge">STEP 02</span>
              </div>
              <div className="camera-layout">
                <div className="camera-stage">
                  <video ref={videoRef} className="camera-video" style={{ display: cameraReady ? "block" : "none" }} autoPlay muted playsInline aria-label="Live camera preview" />
                  {cameraReady && <div className="camera-overlay" aria-hidden="true"><i className="camera-corner tl" /><i className="camera-corner tr" /><i className="camera-corner bl" /><i className="camera-corner br" /></div>}
                  {cameraReady && <div className="camera-status"><span /> CAMERA READY</div>}
                  {!cameraReady && <div className="camera-start"><Camera /><p>Allow camera access to see your preview.</p></div>}
                  {countdown !== null && <motion.div key={countdown} className="camera-countdown" initial={{ scale: .7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.2, opacity: 0 }} aria-live="assertive">{countdown}</motion.div>}
                  <AnimatePresence>{flash && <motion.div className="flash-effect active" initial={{ opacity: .9 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} />}</AnimatePresence>
                </div>
                <aside className="camera-sidebar">
                  <div className="capture-progress-card">
                    <h3>Your photo sequence <span style={{ color: "var(--muted)", fontWeight: 500 }}>({captured.length}/4)</span></h3>
                    <div className="capture-thumbnails">
                      {[0, 1, 2, 3].map((index) => (
                        <div className="capture-thumb" key={index} aria-label={captured[index] ? `Photo ${index + 1} captured` : `Photo ${index + 1} pending`}>
                          {captured[index] ? <Image src={captured[index]} alt={`Capture ${index + 1}`} width={800} height={600} unoptimized /> : `PHOTO ${index + 1}`}
                        </div>
                      ))}
                    </div>
                    <div className="progress-track" role="progressbar" aria-label="Photo capture progress" aria-valuemin={0} aria-valuemax={4} aria-valuenow={captured.length}><div className="progress-fill" style={{ width: `${captured.length * 25}%` }} /></div>
                  </div>
                  <div className="camera-tip"><Lightbulb size={16} /><p>Find a bright spot, keep your camera at eye level, and get ready to have a little fun.</p></div>
                  {permissionError && <div className="camera-permission-error" role="alert"><strong>We need your camera</strong>{permissionError}</div>}
                  <div className="camera-controls">
                    {!cameraReady ? (
                      <button className="button button-primary" type="button" onClick={requestCamera}><Camera size={15} /> Enable camera</button>
                    ) : (
                      <button className="button button-primary" type="button" onClick={capture} disabled={capturing}>
                        {capturing ? <><LoaderCircle className="animate-spin" size={15} /> Capturing…</> : <><Camera size={15} /> {captured.length ? "Capture again" : "Start 4-photo capture"}</>}
                      </button>
                    )}
                    <button className="button button-secondary" type="button" onClick={() => setStep("template")} disabled={capturing}><ArrowLeft size={14} /> Back</button>
                  </div>
                </aside>
              </div>
            </motion.section>
          )}

          {step === "review" && (
            <motion.section key="review" className="booth-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} aria-labelledby="review-heading">
              <div className="panel-heading">
                <div><h2 id="review-heading">Your moments</h2><p>Four little snapshots, one lovely memory. Ready to make your strip?</p></div>
                <span className="step-badge">STEP 03</span>
              </div>
              <div className="review-grid">
                {photos.map((photo, index) => <div className="review-shot" key={`${index}-${photo.slice(-14)}`}><Image src={photo} alt={`Photo ${index + 1}`} width={800} height={600} unoptimized /><span>PHOTO {index + 1}</span></div>)}
              </div>
              <div className="panel-actions">
                <div className="action-group">
                  <button className="button button-secondary" type="button" onClick={() => setStep("camera")}><ArrowLeft size={14} /> Back</button>
                  <button className="button button-secondary" type="button" onClick={retake}><RotateCcw size={14} /> Retake all</button>
                </div>
                <button className="button button-primary" type="button" onClick={() => setStep("editor")}>Generate my strip <Sparkles size={14} /></button>
              </div>
            </motion.section>
          )}

          {step === "editor" && (
            <motion.section key="editor" className="booth-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} aria-labelledby="editor-heading">
              <div className="panel-heading">
                <div><h2 id="editor-heading">Make it yours</h2><p>Personalize your photostrip, then save, download, or share.</p></div>
                <span className="step-badge">STEP 04</span>
              </div>
              <div className="editor-layout">
                <div className="editor-options">
                  <div className="field-group"><label htmlFor="employee-name">Your name <span style={{ color: "var(--muted)", fontWeight: 400 }}>(optional)</span></label><input id="employee-name" maxLength={40} placeholder="Add your name" value={employeeName} onChange={(event) => setEmployeeName(event.target.value)} /></div>
                  <div className="field-group"><label htmlFor="event-name">Event</label><select id="event-name" value={eventName} onChange={(event) => setEventName(event.target.value)}>{events.map((event) => <option key={event}>{event}</option>)}</select></div>
                  <div className="field-group"><label htmlFor="event-date">Date</label><input id="event-date" type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} /></div>
                  <div>
                    <p className="sticker-title">Add a little extra</p>
                    <div className="sticker-categories" role="tablist" aria-label="Sticker categories">
                      {categories.map((category) => <button key={category} type="button" role="tab" aria-selected={stickerCategory === category} className={`sticker-category ${stickerCategory === category ? "selected" : ""}`} onClick={() => setStickerCategory(category)}>{category}</button>)}
                    </div>
                    <div className="sticker-grid">
                      {stickers.filter((sticker) => sticker.category === stickerCategory).map((sticker) => {
                        const selected = selectedStickers.includes(sticker.label);
                        return <button className="sticker-button" key={sticker.label} type="button" aria-pressed={selected} onClick={() => toggleSticker(sticker.label)}><span aria-hidden="true">{sticker.glyph}</span>{sticker.label}{selected && <X size={10} />}</button>;
                      })}
                    </div>
                  </div>
                  <div className="camera-tip"><ShieldCheck size={16} /><p>Your photos stay on this device. Save to gallery stores a copy only in this browser.</p></div>
                  <div className="action-group" style={{ flexWrap: "wrap" }}>
                    <button className="button button-primary" type="button" disabled={busy !== ""} onClick={() => exportStrip("png")}>{busy === "png" ? <LoaderCircle className="animate-spin" size={14} /> : <Download size={14} />} PNG</button>
                    <button className="button button-secondary" type="button" disabled={busy !== ""} onClick={() => exportStrip("jpg")}>JPG</button>
                    <button className="button button-secondary" type="button" disabled={busy !== ""} onClick={() => exportStrip("pdf")}>PDF</button>
                  </div>
                  <div className="action-group" style={{ flexWrap: "wrap" }}>
                    <button className="button button-ghost" type="button" disabled={saved || busy !== ""} onClick={saveToGallery}>{saved ? <Check size={14} /> : <Heart size={14} />}{saved ? "Saved" : "Save to gallery"}</button>
                    <button className="button button-secondary" type="button" disabled={busy !== ""} onClick={shareStrip}><Share2 size={14} /> Share</button>
                  </div>
                  <button className="button button-secondary" type="button" onClick={() => setStep("review")}><ArrowLeft size={14} /> Back to photos</button>
                  {saved && <Link className="button button-ghost" href="/gallery"><ImagePlus size={14} /> See your gallery</Link>}
                </div>

                <div className="editor-preview-wrap">
                  <div
                    className="strip-preview"
                    ref={stripRef}
                    style={
                      {
                        "--template-bg": template.background,
                        "--template-color": template.color,
                        "--template-accent": template.accent,
                        background: `radial-gradient(circle at 95% 4%, ${template.accent}26, transparent 32%), ${template.background}`
                      } as React.CSSProperties
                    }
                    aria-label={`${template.name} photostrip preview`}
                  >
                    <div className="strip-brand"><span>{template.eyebrow.split("/")[0].trim()}</span><span className="strip-brand-mark">✳</span></div>
                    <h3 className="strip-title">{template.title}</h3>
                    <p className="strip-subtitle">{template.subtitle}</p>
                    <div className="strip-photos">
                      {photos.map((photo, index) => (
                        <div
                          className="strip-photo"
                          key={`strip-${index}`}
                          onPointerDown={(event) => beginCrop(index, event)}
                          onPointerMove={moveCrop}
                          onPointerUp={() => { cropDrag.current = null; }}
                          onPointerCancel={() => { cropDrag.current = null; }}
                          role="group"
                          aria-label={`Photo ${index + 1}. Drag to adjust its crop.`}
                          style={{
                            backgroundImage: `url("${photo}")`,
                            backgroundPosition: `${cropPositions[index]?.x ?? 50}% ${cropPositions[index]?.y ?? 50}%`
                          }}
                        >
                          <span className="sr-only">Strip photo {index + 1}</span>
                        </div>
                      ))}
                    </div>
                    <FabricStickerLayer labels={fabricLabels} color={template.color} />
                    {employeeName.trim() && <div className="strip-personal">{employeeName.trim()}</div>}
                    <div className="strip-footer">{template.footer}<br /><span style={{ fontWeight: 500, letterSpacing: 0 }}>{eventDate ? new Date(`${eventDate}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : " "}</span><br /><span style={{ fontWeight: 600 }}>{eventName}</span></div>
                    {template.overlayUrl && (
                      <Image
                        className="strip-frame-overlay"
                        src={template.overlayUrl}
                        alt=""
                        width={800}
                        height={1800}
                        unoptimized
                        aria-hidden="true"
                        style={template.overlayLayout ? {
                          left: `${template.overlayLayout.x}%`,
                          top: `${template.overlayLayout.y}%`,
                          width: `${template.overlayLayout.width}%`,
                          right: "auto",
                          bottom: "auto",
                          height: "auto",
                          objectFit: "contain"
                        } : undefined}
                      />
                    )}
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
      <Toast message={toast} onDismiss={() => setToast("")} />
    </div>
  );
}
