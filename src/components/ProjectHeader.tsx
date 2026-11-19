import type { InferenceBadge } from "../lib/types";

export function ProjectHeader({
  title,
  category,
  badge,
  label,
  onPrivacy,
  onPresent,
  onExport,
}: {
  title: string;
  category: string;
  badge: InferenceBadge | "idle";
  label: string;
  onPrivacy: () => void;
  onPresent: () => void;
  onExport: () => void;
}) {
  const mode =
    badge === "on-device"
      ? "ON_DEVICE"
      : badge === "cloud"
        ? "IN_CLOUD"
        : badge === "error-fallback"
          ? "LOCAL_FALLBACK_ERROR"
          : "STUDIO_PREVIEW";

  return (
    <header className="topbar" data-testid="project-header">
      <div className="topbar-title">
        <h1>{title || "Untitled brief"}</h1>
        <p>
          {category || "Independent practice"}
          <span className="saved-pill">Saved locally</span>
        </p>
      </div>
      <div className="topbar-actions">
        <button type="button" className="status-pill" data-kind={badge === "idle" ? "preview" : badge} data-testid="privacy-pill" onClick={onPrivacy} title={label}>
          <span className="dot" aria-hidden="true" />
          {mode}
        </button>
        <button type="button" className="btn-secondary" data-testid="present-client" onClick={onPresent}>
          Present to Client
        </button>
        <button type="button" className="btn-secondary" data-testid="header-export" onClick={onExport}>
          Export
        </button>
      </div>
    </header>
  );
}
