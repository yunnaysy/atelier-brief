import type { ReactNode } from "react";
import type { WorkspaceTab } from "../lib/types";

const ITEMS: { id: WorkspaceTab; label: string; icon: ReactNode }[] = [
  {
    id: "brief",
    label: "Brief",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M7 3.75h7.5L19 8.25v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.75a1 1 0 0 1 1-1Z" />
        <path d="M14.25 3.75V8.5H19M9 12.25h6M9 15.75h4.5" />
      </svg>
    ),
  },
  {
    id: "sitemap",
    label: "Sitemap",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="9" y="3.5" width="6" height="4.5" rx="1" />
        <path d="M12 8v3.25M7 11.25h10" />
        <rect x="3.5" y="14.5" width="5.5" height="5.5" rx="1" />
        <rect x="9.25" y="14.5" width="5.5" height="5.5" rx="1" />
        <rect x="15" y="14.5" width="5.5" height="5.5" rx="1" />
      </svg>
    ),
  },
  {
    id: "art",
    label: "Direction",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M12 4.5 13.7 9.3l5.1.3-4 3.2 1.3 4.9L12 15.4 8 17.7l1.3-4.9-4-3.2 5.1-.3L12 4.5Z" />
      </svg>
    ),
  },
  {
    id: "export",
    label: "Export",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M12 4.75v9.5M8.5 8 12 4.75 15.5 8" />
        <path d="M5.5 14.5V18a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-3.5" />
      </svg>
    ),
  },
];

function NavButtons({ tab, onTab, withIcons }: { tab: WorkspaceTab; onTab: (tab: WorkspaceTab) => void; withIcons?: boolean }) {
  return (
    <>
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          data-tab={item.id}
          data-active={tab === item.id}
          onClick={() => onTab(item.id)}
        >
          {withIcons ? <span className="nav-glyph">{item.icon}</span> : null}
          {item.label}
        </button>
      ))}
    </>
  );
}

export function StageNav({ tab, onTab }: { tab: WorkspaceTab; onTab: (tab: WorkspaceTab) => void }) {
  return (
    <div className="stage-nav-wrap">
      <nav className="stage-nav" data-testid="stage-nav" aria-label="Workspace">
        <NavButtons tab={tab} onTab={onTab} />
      </nav>
    </div>
  );
}

export function BottomNav({ tab, onTab }: { tab: WorkspaceTab; onTab: (tab: WorkspaceTab) => void }) {
  return (
    <nav className="bottom-nav" data-testid="bottom-nav" aria-label="Workspace">
      <NavButtons tab={tab} onTab={onTab} withIcons />
    </nav>
  );
}
