export type ViewMode = 'home' | 'generator' | 'result' | 'profile';
export type CardType = 'card' | 'pfp';

export interface ThemeConfig {
  id: string;
  name: string;
  badge: string;
  gradient: string;
  borderGlow: string;
  textColor: string;
  accentColor: string;
  secondaryAccent: string;
  cardBg: string;
  headerBg: string;
  qrColor: string;
  ringColor: string;
  pattern: string;
}

export interface BuilderData {
  name: string;
  role: string;
  stack: string[];
  github?: string;
  title: string;
  badgeNumber: string;
  photoUrl: string | null;
  crop: { x: number; y: number };
  zoom: number;
  rotation: number;
  croppedAreaPixels: { x: number; y: number; width: number; height: number } | null;
  themeId: string;
  builderId?: string;
}

export interface HistoryState {
  past: BuilderData[];
  present: BuilderData;
  future: BuilderData[];
}
