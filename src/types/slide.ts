export type SlideLayout =
  | "title"
  | "section"
  | "title-bullets"
  | "two-column"
  | "quote"
  | "chart"
  | "image-text"
  | "diagram"
  | "agenda"
  | "stat"
  | "comparison"
  | "team"
  | "closing";

export type ChartType = "bar" | "line" | "pie" | "donut";

export interface ChartSeries {
  name: string;
  values: number[];
}

export interface ChartData {
  type: ChartType;
  categories: string[];
  series: ChartSeries[];
}

export interface TeamMember {
  name: string;
  role: string;
}

/** Freeform position/size override for a movable text block, in percentages of the slide canvas. */
export interface BoxOverride {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BrandKit {
  logoDataUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  headingFont?: string;
  bodyFont?: string;
}

export interface Slide {
  id: string;
  layout: SlideLayout;
  title?: string;
  subtitle?: string;
  bullets?: string[];
  leftBullets?: string[];
  rightBullets?: string[];
  leftTitle?: string;
  rightTitle?: string;
  body?: string;
  quoteAuthor?: string;
  chart?: ChartData;
  diagramCode?: string;
  icon?: string;
  imageDataUrl?: string;
  frame?: string;
  notes?: string;
  statValue?: string;
  statLabel?: string;
  teamMembers?: TeamMember[];
  /** Per-slide freeform position/size overrides for movable text blocks, keyed by slot name. */
  textOverrides?: Record<string, BoxOverride>;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  headingFont: string;
  bodyFont: string;
  colors: ThemeColors;
  style: "corporate" | "creative" | "minimal" | "bold" | "elegant" | "tech";
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
}

export interface Presentation {
  id: string;
  title: string;
  themeId: string;
  language?: string;
  paletteOverride?: string[];
  brandKit?: BrandKit;
  slides: Slide[];
}

export interface GenerateRequest {
  sourceText: string;
  inputKind: "notes" | "idea" | "meeting" | "raw";
  themeId: string;
  slideCount: number;
  language: string;
}

export interface GenerateResponse {
  title: string;
  slides: Slide[];
}
