declare module "drizzle-orm" {
  export const and: any;
  export const eq: any;
  export const asc: any;
  export const desc: any;
  export const sql: any;
  export const relations: any;
}

declare module "drizzle-orm/node-postgres" {
  export const drizzle: any;
}

declare module "drizzle-orm/pg-core" {
  export const pgTable: any;
  export const text: any;
  export const timestamp: any;
  export const jsonb: any;
  export const real: any;
  export const integer: any;
  export const index: any;
  export const uuid: any;
  export const doublePrecision: any;
}

declare module "lucide-react" {
  import type { ComponentType, SVGProps } from "react";
  export type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string; className?: string }>;
  export const ScanSearch: LucideIcon;
  export const ListChecks: LucideIcon;
  export const Crosshair: LucideIcon;
  export const Radius: LucideIcon;
  export const ShieldAlert: LucideIcon;
  export const Hourglass: LucideIcon;
  export const ScanEye: LucideIcon;
  export const MessageSquareQuote: LucideIcon;
  export const UserCheck: LucideIcon;
  export const ChartColumn: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const MonitorSmartphone: LucideIcon;
  export const Presentation: LucideIcon;
  export const Check: LucideIcon;
  export const CircleHelp: LucideIcon;
  export const Layers: LucideIcon;
  export const Loader2: LucideIcon;
  export const Plus: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const Trash2: LucideIcon;
  export const UserRound: LucideIcon;
  export const X: LucideIcon;
  export const CloudUpload: LucideIcon;
  export const FileImage: LucideIcon;
  export const TriangleAlert: LucideIcon;
  export const Eye: LucideIcon;
  export const Sparkles: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const XCircle: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Activity: LucideIcon;
  export const Sliders: LucideIcon;
  export const ZoomIn: LucideIcon;
  export const Compass: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Maximize2: LucideIcon;
  export const Terminal: LucideIcon;
  export const Gauge: LucideIcon;
  export const Info: LucideIcon;
  export const Zap: LucideIcon;
  export const Cpu: LucideIcon;
  export const Filter: LucideIcon;
}
