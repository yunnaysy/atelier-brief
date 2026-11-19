import type { InferenceBadge, Telemetry } from "../lib/types";

const SHORT: Record<InferenceBadge, string> = {
  "on-device": "On-Device · Gemini Nano",
  cloud: "Cloud Fallback · Firebase AI Logic",
  preview: "Local Preview",
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
    telemetry.redactionCount != null ? `${telemetry.redactionCount} redacted` : null,
  ].filter(Boolean);

  return (
    <span className="telemetry" data-kind={telemetry.badge} title={telemetry.label}>
      <span className="dot" aria-hidden="true" />
      <span>
        {title}
        {extras.length ? ` · ${extras.join(" · ")}` : ""}
      </span>
    </span>
  );
}
