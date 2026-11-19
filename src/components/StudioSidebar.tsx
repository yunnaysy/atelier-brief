import { Folder, Layers, Plus, ShieldCheck } from "lucide-react";
import { Icon } from "./icons";
import type { InferenceBadge, StudioProject, WorkspaceTab } from "../lib/types";
import { humanBadgeLabel } from "../lib/validateBundle";

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
  onJudgeDemo,
  demoBusy,
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
  onJudgeDemo: () => void;
  demoBusy: boolean;
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
        <button type="button" className="nav-link" data-active={tab === "export"} aria-current={tab === "export" ? "page" : undefined} onClick={() => onTab("export")}>
          <Icon as={Folder} />
          <span>Projects</span>
        </button>
        <button type="button" className="nav-link" data-testid="new-brief" onClick={onNew}>
          <Icon as={Plus} />
          <span>New Brief</span>
        </button>
        <button type="button" className="nav-link" data-testid="judge-demo-nav" onClick={onJudgeDemo} disabled={demoBusy}>
          <Icon as={Layers} />
          <span>Load sample project</span>
        </button>
        <div className="nav-recent">
          <p className="label">Recent projects</p>
          {recent.map((item) => (
            <button
              key={item.id}
              type="button"
              className="nav-link nav-recent-item"
              data-active={item.id === activeId}
              aria-current={item.id === activeId ? "true" : undefined}
              onClick={() => onOpen(item.id)}
            >
              {item.intake.projectName || "Untitled brief"}
            </button>
          ))}
        </div>
      </div>

      <div className="nav-foot">
        <button type="button" className="nav-link privacy-entry" data-testid="privacy-entry" onClick={onPrivacy}>
          <Icon as={ShieldCheck} />
          <span>Privacy &amp; AI</span>
          <span className="nav-badge" data-kind={badge}>
            {humanBadgeLabel(badge)}
          </span>
        </button>
      </div>
    </aside>
  );
}
