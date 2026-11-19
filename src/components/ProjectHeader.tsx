import { CircleCheck, MonitorPlay, Sparkles } from "lucide-react";
import { Icon } from "./icons";

export function ProjectHeader({
  title,
  category,
  busy,
  onPresent,
  onCompose,
}: {
  title: string;
  category: string;
  busy: boolean;
  onPresent: () => void;
  onCompose: () => void;
}) {
  return (
    <header className="topbar" data-testid="project-header">
      <div className="topbar-title">
        <h1>{title || "Untitled brief"}</h1>
        <p>
          {category || "Independent practice"}
          <span className="saved-pill"><Icon as={CircleCheck} size={13} />Saved</span>
        </p>
      </div>
      <div className="topbar-actions">
        <button type="button" className="btn-primary" data-testid="compose" onClick={onCompose} disabled={busy}>
          <Icon as={Sparkles} size={16} />
          <span className="action-full">{busy ? "Composing…" : "Generate brief"}</span>
          <span className="action-short">{busy ? "…" : "Generate"}</span>
        </button>
        <button type="button" className="btn-secondary" data-testid="present-client" onClick={onPresent}>
          <Icon as={MonitorPlay} size={16} />
          <span className="action-full">Present to Client</span>
          <span className="action-short">Present</span>
        </button>
      </div>
    </header>
  );
}
