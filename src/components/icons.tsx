import type { LucideIcon } from "lucide-react";

/** Shared Lucide outline icon: decorative (aria-hidden), monochrome via currentColor. */
export function Icon({ as: Glyph, size = 18, className = "" }: { as: LucideIcon; size?: number; className?: string }) {
  return (
    <Glyph
      size={size}
      strokeWidth={1.8}
      absoluteStrokeWidth
      aria-hidden="true"
      focusable="false"
      className={`ab-icon ${className}`.trim()}
    />
  );
}
