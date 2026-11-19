import type { StudioProject } from "../lib/types";
import { HYBRID_MODES } from "../lib/hybridAi";

interface Props {
  project: StudioProject;
  projects: StudioProject[];
  onCopy: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onOpen: (id: string) => void;
  onNew: () => void;
}

export function ExportHandoff({ project, projects, onCopy, onDownload, onPrint, onOpen, onNew }: Props) {
  return (
    <div data-testid="export-handoff">
      <div className="sitemap-intro" style={{ maxWidth: "54rem", margin: "0 auto 1rem" }}>
        <div>
          <p className="label">Handoff</p>
          <h2 className="sitemap-intro" style={{ fontFamily: "var(--serif)", fontSize: "2rem", margin: 0, letterSpacing: "-0.04em", fontWeight: 500 }}>
            Export &amp; archive
          </h2>
        </div>
      </div>

      <div className="export-grid">
        <button type="button" className="export-card" data-testid="copy-markdown" onClick={onCopy}>
          <strong>Copy Markdown</strong>
          <span>Place a complete brief, sitemap, and art direction on the clipboard.</span>
        </button>
        <button type="button" className="export-card" data-testid="download-markdown" onClick={onDownload}>
          <strong>Download .md</strong>
          <span>A portable file the studio can drop into a repo or a client folder.</span>
        </button>
        <button type="button" className="export-card" data-testid="print-brief" onClick={onPrint}>
          <strong>Print-ready brief</strong>
          <span>Open the browser print dialog with studio chrome removed.</span>
        </button>
        <button type="button" className="export-card" onClick={onNew}>
          <strong>New project</strong>
          <span>Keep the current brief in the local archive and start a clean intake.</span>
        </button>
      </div>

      <div className="saved">
        <p className="label">Local archive</p>
        <p className="reason">
          Projects persist in IndexedDB (with a localStorage fallback) on this computer only. Nothing is sent to a
          server until you connect a Firebase Spark project. Inference modes used by the official SDK:{" "}
          {HYBRID_MODES.PREFER_ON_DEVICE}, {HYBRID_MODES.ONLY_ON_DEVICE}, {HYBRID_MODES.ONLY_IN_CLOUD}.
        </p>
        <ul>
          {projects.map((item) => (
            <li key={item.id}>
              <button type="button" className="subtle" onClick={() => onOpen(item.id)}>
                <strong>{item.intake.projectName || "Untitled brief"}</strong>
                <div className="reason" style={{ margin: 0 }}>
                  {item.intake.clientName || "No client"} · {new Date(item.updatedAt).toLocaleString()}
                  {item.id === project.id ? " · open" : ""}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
