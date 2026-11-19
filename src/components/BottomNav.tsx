import type { WorkspaceTab } from "../lib/types";

const ITEMS: { id: WorkspaceTab; label: string }[] = [
  { id: "brief", label: "Brief" },
  { id: "sitemap", label: "Sitemap" },
  { id: "art", label: "Direction" },
  { id: "export", label: "Export" },
];

export function BottomNav({ tab, onTab }: { tab: WorkspaceTab; onTab: (tab: WorkspaceTab) => void }) {
  return (
    <nav className="bottom-nav" data-testid="bottom-nav" aria-label="Workspace">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          data-tab={item.id}
          data-active={tab === item.id}
          onClick={() => onTab(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
