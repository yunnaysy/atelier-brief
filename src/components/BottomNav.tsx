import { Compass, FileText, Network, Upload, type LucideIcon } from "lucide-react";
import { Icon } from "./icons";
import type { WorkspaceTab } from "../lib/types";

const ITEMS: { id: WorkspaceTab; label: string; icon: LucideIcon }[] = [
  { id: "brief", label: "Brief", icon: FileText },
  { id: "sitemap", label: "Sitemap", icon: Network },
  { id: "art", label: "Direction", icon: Compass },
  { id: "export", label: "Export", icon: Upload },
];

function NavButtons({ tab, onTab, iconSize }: { tab: WorkspaceTab; onTab: (tab: WorkspaceTab) => void; iconSize: number }) {
  return (
    <>
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          data-tab={item.id}
          data-active={tab === item.id}
          aria-current={tab === item.id ? "page" : undefined}
          onClick={() => onTab(item.id)}
        >
          <span className="nav-glyph"><Icon as={item.icon} size={iconSize} /></span>
          <span className="nav-text">{item.label}</span>
        </button>
      ))}
    </>
  );
}

export function StageNav({ tab, onTab }: { tab: WorkspaceTab; onTab: (tab: WorkspaceTab) => void }) {
  return (
    <div className="stage-nav-wrap">
      <nav className="stage-nav" data-testid="stage-nav" aria-label="Workspace">
        <NavButtons tab={tab} onTab={onTab} iconSize={18} />
      </nav>
    </div>
  );
}

export function BottomNav({ tab, onTab }: { tab: WorkspaceTab; onTab: (tab: WorkspaceTab) => void }) {
  return (
    <nav className="bottom-nav" data-testid="bottom-nav" aria-label="Workspace">
      <NavButtons tab={tab} onTab={onTab} iconSize={20} />
    </nav>
  );
}
