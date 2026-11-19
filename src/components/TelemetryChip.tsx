import type { InferenceBadge, Telemetry } from "../lib/types";

const SHORT: Record<InferenceBadge, string> = {
  "on-device": "On-Device · Gemini Nano",
  cloud: "Cloud Fallback · Firebase AI Logic",
  "error-fallback": "Local Fallback · AI Call Failed",
  preview: "Studio Preview · Deterministic Non-AI",
};

export function TelemetryChip({
  telemetry,
  compact = false,
}: {
  telemetry: Pick<Telemetry, "badge" | "label" | "latencyMs" | "redactionCount"> | {
    badge: InferenceBadge;
    label: string;
    latencyMs?: number;
    redactionCount?: number;
  };
  compact?: boolean;
}) {
  const title = compact ? SHORT[telemetry.badge] : telemetry.label;
  const extras = [
    telemetry.latencyMs != null ? `${telemetry.latencyMs} ms` : null,
    telemetry.redactionCount != null && telemetry.redactionCount > 0
      ? `${telemetry.redactionCount} redacted`
      : null,
  ].filter(Boolean);

  return (
    <span className="telemetry" data-kind={telemetry.badge} data-testid="telemetry-chip" title={telemetry.label}>
      <span className="dot" aria-hidden="true" />
      <span>
        {title}
        {extras.length ? ` · ${extras.join(" · ")}` : ""}
      </span>
    </span>
  );
}
