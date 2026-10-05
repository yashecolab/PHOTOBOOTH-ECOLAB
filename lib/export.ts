import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function renderElement(element: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    logging: false
  });
}

export async function downloadElement(
  element: HTMLElement,
  format: "png" | "jpg" = "png",
  filename = "edc-moments"
): Promise<void> {
  const canvas = await renderElement(element);
  const mime = format === "jpg" ? "image/jpeg" : "image/png";
  const data = canvas.toDataURL(mime, 0.94);
  const link = document.createElement("a");
  link.download = `${filename}.${format}`;
  link.href = data;
  link.click();
}

export async function downloadPdf(
  element: HTMLElement,
  filename = "edc-moments"
): Promise<void> {
  const canvas = await renderElement(element);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: [canvas.width, canvas.height]
  });
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(`${filename}.pdf`);
}
