import {
  Play,
  Video,
  LayoutGrid,
  Image,
  BookOpen,
  Newspaper,
  FileText,
  Mic,
  Mail,
  MessageSquare,
  LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  play: Play,
  video: Video,
  "layout-grid": LayoutGrid,
  image: Image,
  "book-open": BookOpen,
  newspaper: Newspaper,
  "file-text": FileText,
  mic: Mic,
  mail: Mail,
  "message-square": MessageSquare,
};

const COLOR_MAP: Record<string, { textColor: string; bgColor: string }> = {
  red: { textColor: "text-red-500", bgColor: "bg-red-500/10" },
  blue: { textColor: "text-blue-500", bgColor: "bg-blue-500/10" },
  green: { textColor: "text-green-500", bgColor: "bg-green-500/10" },
  purple: { textColor: "text-purple-500", bgColor: "bg-purple-500/10" },
  amber: { textColor: "text-amber-500", bgColor: "bg-amber-500/10" },
  cyan: { textColor: "text-cyan-500", bgColor: "bg-cyan-500/10" },
  pink: { textColor: "text-pink-500", bgColor: "bg-pink-500/10" },
  orange: { textColor: "text-orange-500", bgColor: "bg-orange-500/10" },
  teal: { textColor: "text-teal-500", bgColor: "bg-teal-500/10" },
  indigo: { textColor: "text-indigo-500", bgColor: "bg-indigo-500/10" },
};

export function getFormatoIcon(icone: string): LucideIcon {
  return ICON_MAP[icone] || Play;
}

export function getFormatoColors(cor: string): { textColor: string; bgColor: string } {
  return COLOR_MAP[cor] || COLOR_MAP.red;
}
