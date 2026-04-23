export type SlideStatus = "approved" | "in-progress" | "sent" | "draft";

export interface SlideElement {
  id: string;
  type: "text" | "image" | "shape" | "mockup" | "gif";
  content: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  opacity?: number;
  zIndex?: number;
  rotation?: number;
  flipH?: boolean;
  flipV?: boolean;
  flipX?: boolean;
  flipY?: boolean;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  /* Mockup-specific */
  mockupType?: string;
  mockupChild?: string; // image src dropped inside
  mockupChildScale?: number; // zoom factor (1 = 100%)
  mockupChildX?: number; // horizontal position as % of image width
  mockupChildY?: number; // vertical position as % of image height
  /* Shape-specific */
  shapeType?: "rect" | "circle" | "triangle" | "line" | "blob1" | "blob2" | "star" | "arrow";
  /* Animation */
  animation?: "none" | "fade-in" | "slide-up" | "pop-bounce";
}

export interface SlideData {
  id: string;
  type: "cover" | "content" | "art";
  title: string;
  body?: string;
  image?: string;
  bullets?: string[];
  colors?: { name: string; hex: string }[];
  elements?: SlideElement[];
}

export interface Campaign {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  status: SlideStatus;
  slides: SlideData[];
}
