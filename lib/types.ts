export type TemplateId = string;

export type OverlayLayout = {
  x: number;
  y: number;
  width: number;
};

export type Template = {
  id: TemplateId;
  name: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  footer: string;
  tags: string[];
  color: string;
  accent: string;
  background: string;
  enabled?: boolean;
  builtIn?: boolean;
  overlayUrl?: string;
  overlayLayout?: OverlayLayout;
};

export type GalleryItem = {
  id: string;
  image: string;
  templateId: TemplateId;
  eventName: string;
  employeeName: string;
  createdAt: string;
  likes: number;
  liked: boolean;
};
