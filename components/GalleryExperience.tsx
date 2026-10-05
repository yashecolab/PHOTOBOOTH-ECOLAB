"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Camera,
  Download,
  Heart,
  Images,
  LoaderCircle,
  Search,
  Share2,
  Sparkles
} from "lucide-react";
import { events } from "@/lib/data";
import { useFrameTemplates } from "@/hooks/useFrameTemplates";
import { readGallery, saveGallery, subscribeGallery } from "@/lib/storage";
import type { GalleryItem } from "@/lib/types";
import { Toast } from "@/components/Toast";

function downloadImage(item: GalleryItem) {
  const link = document.createElement("a");
  link.href = item.image;
  link.download = `edc-moments-${item.id}.jpg`;
  link.click();
}

export function GalleryExperience() {
  const { frames } = useFrameTemplates();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("All events");
  const [toast, setToast] = useState("");
  const [sharingId, setSharingId] = useState("");

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (active) setItems(readGallery());
    };
    const frame = window.requestAnimationFrame(refresh);
    const unsubscribe = subscribeGallery(refresh);
    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return items.filter((item) => {
      const matchesEvent = eventFilter === "All events" || item.eventName === eventFilter;
      const templateName = frames.find((template) => template.id === item.templateId)?.name ?? "";
      const matchesQuery =
        !normalized ||
        [item.eventName, item.employeeName, templateName]
          .some((value) => value.toLocaleLowerCase().includes(normalized));
      return matchesEvent && matchesQuery;
    });
  }, [eventFilter, frames, items, query]);

  function toggleLike(id: string) {
    const next = items.map((item) =>
      item.id === id
        ? { ...item, liked: !item.liked, likes: Math.max(0, item.likes + (item.liked ? -1 : 1)) }
        : item
    );
    try {
      saveGallery(next);
    } catch (error) {
      console.error("Could not update local gallery likes.", error);
      setToast("We couldn’t update this like in browser storage.");
    }
  }

  async function share(item: GalleryItem) {
    setSharingId(item.id);
    try {
      const response = await fetch(item.image);
      const blob = await response.blob();
      const file = new File([blob], "edc-moments.jpg", { type: blob.type || "image/jpeg" });
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: "EDC Moments", text: `A little moment from ${item.eventName}.` });
      } else {
        downloadImage(item);
        setToast("Photo sharing isn’t supported here, so we downloaded your memory instead.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Could not share gallery photo.", error);
      setToast("Sharing isn’t available right now. Try downloading your memory.");
    } finally {
      setSharingId("");
    }
  }

  return (
    <div className="page-wrap">
      <header className="page-heading">
        <span className="section-kicker">A little look back</span>
        <h1>Your moments.</h1>
        <p>Your personal gallery, saved only in this browser. Nothing is uploaded or shared automatically.</p>
      </header>
      <div className="gallery-toolbar">
        <div className="gallery-controls">
          <label className="search-field">
            <Search size={15} aria-hidden="true" />
            <input
              type="search"
              aria-label="Search gallery by event, name, or frame"
              placeholder="Search memories…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label>
            <span className="sr-only">Filter gallery by event</span>
            <select className="filter-select" value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}>
              <option>All events</option>
              {events.map((event) => <option key={event}>{event}</option>)}
            </select>
          </label>
        </div>
        {items.length > 0 && <span className="tag">{filtered.length} {filtered.length === 1 ? "memory" : "memories"}</span>}
      </div>

      {filtered.length > 0 ? (
        <div className="gallery-grid">
          {filtered.map((item) => {
            const templateName = frames.find((template) => template.id === item.templateId)?.name ?? "EDC Moments";
            const created = new Date(item.createdAt);
            return (
              <article className="gallery-card" key={item.id}>
                <Image className="gallery-image" src={item.image} alt={`Photostrip from ${item.eventName}${item.employeeName ? ` by ${item.employeeName}` : ""}`} width={600} height={1500} unoptimized />
                <div className="gallery-card-content">
                  <div className="gallery-card-title">
                    <div>
                      <h3>{item.employeeName || templateName}</h3>
                      <p>{item.eventName} · {created.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <button
                      className={`like-button${item.liked ? " liked" : ""}`}
                      type="button"
                      aria-label={`${item.liked ? "Unlike" : "Like"} ${item.eventName} memory`}
                      aria-pressed={item.liked}
                      onClick={() => toggleLike(item.id)}
                    >
                      <Heart size={16} fill={item.liked ? "currentColor" : "none"} />{item.likes}
                    </button>
                  </div>
                  <div className="gallery-card-actions">
                    <button className="button button-secondary" type="button" onClick={() => { downloadImage(item); setToast("Your memory is downloading."); }}><Download size={13} /> Download again</button>
                    <button className="button button-ghost" type="button" onClick={() => share(item)} disabled={sharingId === item.id} aria-label={`Share memory from ${item.eventName}`}>
                      {sharingId === item.id ? <LoaderCircle className="animate-spin" size={13} /> : <Share2 size={13} />} Share
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div>
            <div className="empty-state-icon"><Images size={24} /></div>
            <h2>{items.length ? "No memories found" : "A gallery, waiting for you."}</h2>
            <p>{items.length ? "Try a different search or event filter." : "Make your first photostrip and save it here. Your photos never leave this device."}</p>
            <Link href="/booth" className="button button-primary">{items.length ? <><Sparkles size={14} /> Create another moment</> : <><Camera size={14} /> Start your first photo</>}<ArrowRight size={14} /></Link>
          </div>
        </div>
      )}
      <Toast message={toast} onDismiss={() => setToast("")} />
    </div>
  );
}
