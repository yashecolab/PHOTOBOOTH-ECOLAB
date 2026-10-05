"use client";

import { useEffect, useRef } from "react";
import { Canvas, FabricText } from "fabric";

type FabricLabel = { label: string; glyph: string };

function renderStickers(canvas: Canvas, labels: FabricLabel[], color: string) {
  canvas.clear();
  labels.forEach((sticker, index) => {
    const object = new FabricText(`${sticker.glyph}  ${sticker.label}`, {
      left: canvas.getWidth() / 2 + (index - (labels.length - 1) / 2) * 16,
      top: 37,
      originX: "center",
      originY: "center",
      fontFamily: "Arial, sans-serif",
      fontSize: 13,
      fontWeight: 700,
      fill: color,
      backgroundColor: "rgba(255,255,255,0.9)",
      padding: 7,
      selectable: true,
      hasControls: false,
      lockMovementY: true,
      lockRotation: true,
      hoverCursor: "grab"
    });
    canvas.add(object);
  });
  canvas.renderAll();
}

export function FabricStickerLayer({
  labels,
  color
}: {
  labels: FabricLabel[];
  color: string;
}) {
  const elementRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const labelsRef = useRef(labels);
  const colorRef = useRef(color);

  useEffect(() => {
    labelsRef.current = labels;
    colorRef.current = color;
    if (canvasRef.current) renderStickers(canvasRef.current, labels, color);
  }, [color, labels]);

  useEffect(() => {
    const element = elementRef.current;
    const parent = element?.parentElement;
    if (!element || !parent) return;

    const canvas = new Canvas(element, {
      width: parent.clientWidth,
      height: 74,
      selection: false,
      preserveObjectStacking: true,
      renderOnAddRemove: true
    });
    canvasRef.current = canvas;

    const resizeObserver = new ResizeObserver(() => {
      const nextWidth = parent.clientWidth;
      if (nextWidth > 0) {
        canvas.setDimensions({ width: nextWidth, height: 74 });
        renderStickers(canvas, labelsRef.current, colorRef.current);
      }
    });
    resizeObserver.observe(parent);

    renderStickers(canvas, labelsRef.current, colorRef.current);
    return () => {
      resizeObserver.disconnect();
      canvasRef.current = null;
      void canvas.dispose();
    };
  }, []);

  return (
    <div className={`fabric-sticker-layer${labels.length ? " has-stickers" : ""}`} aria-label="Draggable photostrip stickers">
      <canvas ref={elementRef} aria-label="Stickers. Drag to rearrange them on your strip." />
    </div>
  );
}
