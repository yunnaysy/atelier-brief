import type { InferenceBadge, StudioProject, WorkspaceTab } from "../lib/types";

const STEPS: { id: WorkspaceTab; label: string; index: string }[] = [
  { id: "brief", label: "Brief", index: "01" },
  { id: "sitemap", label: "Sitemap", index: "02" },
  { id: "art", label: "Direction", index: "03" },
  { id: "export", label: "Export", index: "04" },
];

export function StudioSidebar({
  projects,
  activeId,
  tab,
  configured,
  badge,
  onTab,
  onOpen,
  onNew,
  onPrivacy,
}: {
  projects: StudioProject[];
  activeId: string;
  tab: WorkspaceTab;
  configured: boolean;
  badge: InferenceBadge | "idle";
  onTab: (tab: WorkspaceTab) => void;
  onOpen: (id: string) => void;
  onNew: () => void;
  onPrivacy: () => void;
}) {
  const recent = projects.slice(0, 5);
  return (
    <aside className="nav" data-testid="studio-sidebar">
      <div className="nav-brand">
        <p className="brand-kicker">Atelier</p>
        <strong>Atelier Brief</strong>
        <span className="nav-status">
          {configured ? "Firebase ready · saved locally" : "Studio preview · saved locally"}
        </span>
      </div>

      <div className="nav-block">
        <p className="label">Workspace</p>
        <button type="button" className="nav-link" data-active={tab === "export"} onClick={() => onTab("export")}>
          Projects
        </button>
        <button type="button" className="nav-link" data-testid="new-brief" onClick={onNew}>
          New Brief
        </button>
        <div className="nav-recent">
          <p className="label">Recent projects</p>
          {recent.map((item) => (
            <button
              key={item.id}
              type="button"
              className="nav-link nav-recent-item"
              data-active={item.id === activeId}
              onClick={() => onOpen(item.id)}
            >
              {item.intake.projectName || "Untitled brief"}
            </button>
          ))}
        </div>
      </div>

      <div className="nav-block">
        <p className="label">Current project</p>
        {STEPS.map((step) => (
          <button
            key={step.id}
            type="button"
            className="nav-link"
            data-tab={step.id}
            data-active={tab === step.id}
            onClick={() => onTab(step.id)}
          >
            <span className="mono-index">{step.index}</span>
            {step.label}
          </button>
        ))}
      </div>

      <div className="nav-foot">
        <button type="button" className="nav-link privacy-entry" data-testid="privacy-entry" onClick={onPrivacy}>
          <span className="mono-index">AI</span>
          Privacy &amp; AI
          <span className="nav-badge" data-kind={badge}>
            {badge === "on-device"
              ? "ON_DEVICE"
              : badge === "cloud"
                ? "IN_CLOUD"
                : badge === "error-fallback"
                  ? "LOCAL_FALLBACK_ERROR"
                  : "STUDIO_PREVIEW"}
          </span>
        </button>
      </div>
    </aside>
  );
}
