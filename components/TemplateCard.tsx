import { Camera } from "lucide-react";
import Image from "next/image";
import type { Template } from "@/lib/types";

export function TemplateCard({
  template,
  selectable = false,
  selected = false,
  onSelect
}: {
  template: Template;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const content = (
    <>
      <div
        className="template-preview"
        style={
          {
            "--template-bg": template.background,
            "--template-color": template.color,
            "--template-accent": template.accent
          } as React.CSSProperties
        }
      >
        {template.overlayUrl && (
          <Image
            className="template-overlay"
            src={template.overlayUrl}
            alt=""
            width={600}
            height={900}
            unoptimized
            aria-hidden="true"
          />
        )}
        <span className="preview-label">{template.eyebrow}</span>
        <div className="preview-photo-stack" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span className="preview-footer">{template.footer}</span>
      </div>
      <div className="template-info">
        <h3>{template.name}</h3>
        {!selectable && (
          <div className="tag-row">
            {template.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
          </div>
        )}
      </div>
    </>
  );

  if (selectable) {
    return (
      <button
        type="button"
        className={`template-select-card${selected ? " selected" : ""}`}
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Select ${template.name} frame`}
      >
        {content}
        {selected && <span className="sr-only">Selected</span>}
      </button>
    );
  }

  return <article className="template-card">{content}</article>;
}

export function RecentMemoryTile({
  title,
  date,
  className = ""
}: {
  title: string;
  date: string;
  className?: string;
}) {
  return (
    <div className={`memory-tile ${className}`}>
      <Camera size={38} strokeWidth={1.5} aria-hidden="true" />
      <div className="memory-overlay">
        <strong>{title}</strong>
        <span>{date}</span>
      </div>
    </div>
  );
}
