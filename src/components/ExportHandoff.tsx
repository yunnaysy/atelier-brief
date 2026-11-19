import { contrastRatio, wcagLabel } from "../lib/artDirection";
import { flattenSitemap } from "../lib/validateBundle";
import { HYBRID_MODES } from "../lib/hybridAi";
import { projectStamp } from "../lib/markdown";
import type { StudioProject } from "../lib/types";

interface Props {
  project: StudioProject;
  projects: StudioProject[];
  confirmDeleteId: string | null;
  onCopy: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onOpen: (id: string) => void;
  onNew: () => void;
  onAskDelete: (id: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (id: string) => void;
}

export function ExportHandoff({
  project,
  projects,
  confirmDeleteId,
  onCopy,
  onDownload,
  onPrint,
  onOpen,
  onNew,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: Props) {
  const { date, version } = projectStamp(project);
  const paper = project.artDirection.palette.find((color) => /field|paper|ivory|alabaster|cream|vellum|plaster/i.test(color.role + color.name))?.hex
    ?? project.artDirection.palette[0]?.hex
    ?? "#FAF8F4";
  const ink = project.artDirection.palette.find((color) => /text|ink|charcoal|espresso/i.test(color.role + color.name))?.hex
    ?? project.artDirection.palette[1]?.hex
    ?? "#171614";

  return (
    <div data-testid="export-handoff">
      <section className="print-cover" aria-hidden="true">
        <p className="label">Atelier Brief</p>
        <h1>{project.intake.projectName || "Untitled brief"}</h1>
        <p>A studio-grade website briefing deliverable.</p>
        <dl>
          <div><dt>Client</dt><dd>{project.intake.clientName || "—"}</dd></div>
          <div><dt>Industry</dt><dd>{project.intake.industry || "—"}</dd></div>
          <div><dt>Date</dt><dd>{date}</dd></div>
          <div><dt>Version</dt><dd>{version}</dd></div>
        </dl>
      </section>

      <div className="sitemap-intro export-intro">
        <div>
          <p className="label">Handoff</p>
          <h2>Export &amp; archive</h2>
        </div>
        <p className="reason" style={{ margin: 0, maxWidth: "36rem" }}>
          A client-ready deliverable: cover, metadata, numbered sections, swatches, sitemap, and type specimens.
        </p>
      </div>

      <div className="export-grid">
        <button type="button" className="export-card" data-testid="copy-markdown" onClick={onCopy}>
          <strong>Copy Markdown</strong>
          <span>Place a complete brief, rationale, sitemap, and art direction on the clipboard.</span>
        </button>
        <button type="button" className="export-card" data-testid="download-markdown" onClick={onDownload}>
          <strong>Download .md</strong>
          <span>A portable file the studio can drop into a repo or a client folder.</span>
        </button>
        <button type="button" className="export-card" data-testid="print-brief" onClick={onPrint}>
          <strong>Print-ready brief</strong>
          <span>Open the browser print dialog with studio chrome removed and a cover page added.</span>
        </button>
        <button type="button" className="export-card" onClick={onNew}>
          <strong>New project</strong>
          <span>Keep the current brief in the local archive and start a clean intake.</span>
        </button>
      </div>

      <article className="deliverable" data-testid="deliverable-preview">
        <header className="deliverable-cover">
          <p className="label">Studio deliverable</p>
          <h3>{project.intake.projectName || "Untitled brief"}</h3>
          <p className="meta">
            {project.intake.clientName || "No client"} · {date} · {version}
          </p>
        </header>

        {project.artDirection.palette.length ? (
          <div className="swatch-row">
            <p className="label">Palette</p>
            <div className="swatches">
              {project.artDirection.palette.map((color) => {
                const vsPaper = contrastRatio(color.hex, paper);
                const vsInk = contrastRatio(color.hex, ink);
                const large = !/text|ink/i.test(color.role);
                return (
                  <div className="swatch" key={`${color.name}-${color.hex}`}>
                    <div className="chip-color" style={{ background: color.hex }} />
                    <dl>
                      <dt>{color.name}</dt>
                      <dd>
                        {color.role} · <span className="hex">{color.hex}</span>
                        <div className="contrast">{vsPaper < 1.2 ? "field surface" : `on field ${vsPaper.toFixed(2)} ${wcagLabel(vsPaper, large)}`}</div>
                        <div className="contrast">{vsInk < (large ? 2.2 : 1.2) ? "near ink" : `on ink ${vsInk.toFixed(2)} ${wcagLabel(vsInk, large)}`}</div>
                      </dd>
                    </dl>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {project.artDirection.hierarchy.length ? (
          <div className="hierarchy" style={{ marginTop: "1.5rem" }}>
            <p className="label">Typography scale</p>
            {project.artDirection.hierarchy.map((row) => (
              <div className="type-row" key={row.role}>
                <div className="role">
                  <div className="label">{row.role}</div>
                  <div className="reason" style={{ margin: "0.35rem 0 0" }}>
                    {row.family}
                    <br />
                    {row.size} · {row.weight} · {row.tracking}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: row.family,
                    fontSize: row.role === "Display" ? "2.2rem" : row.role === "Section" ? "1.4rem" : "1rem",
                    fontWeight: Number(row.weight) || 400,
                    letterSpacing: row.tracking,
                    lineHeight: 1.2,
                  }}
                >
                  {row.sample}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {project.sitemap.length ? (
          <div className="deliverable-sitemap">
            <p className="label">Sitemap hierarchy</p>
            <ul>
              {flattenSitemap(project.sitemap).map((page, index) => (
                <li key={page.id}>
                  <strong>
                    <span className="mono-index">{String(index + 1).padStart(2, "0")}</span>
                    {page.name}
                    {page.priority ? " · Priority" : ""}
                  </strong>
                  <span>{page.purpose}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>

      <div className="saved">
        <p className="label">Local archive</p>
        <p className="reason">
          Projects persist in IndexedDB (with a localStorage fallback) on this computer only. Browser storage is local;
          it is not end-to-end encrypted. Nothing is sent to a server until you connect a Firebase Spark project and
          approve a redacted cloud fallback. Inference modes used by the official SDK:{" "}
          {HYBRID_MODES.PREFER_ON_DEVICE}, {HYBRID_MODES.ONLY_ON_DEVICE}, {HYBRID_MODES.ONLY_IN_CLOUD}.
        </p>
        <ul>
          {projects.map((item) => (
            <li key={item.id} className="archive-row">
              <button type="button" className="subtle" onClick={() => onOpen(item.id)}>
                <strong>{item.intake.projectName || "Untitled brief"}</strong>
                <div className="reason" style={{ margin: 0 }}>
                  {item.intake.clientName || "No client"} · {new Date(item.updatedAt).toLocaleString()}
                  {item.id === project.id ? " · open" : ""}
                </div>
              </button>
              {confirmDeleteId === item.id ? (
                <div className="confirm" data-testid="delete-confirm">
                  <p>
                    Delete “{item.intake.projectName || "Untitled brief"}” from this browser’s archive? This only
                    removes it from local IndexedDB / localStorage. It is not end-to-end encrypted, and it never left
                    this device unless you exported it.
                  </p>
                  <div className="confirm-actions">
                    <button type="button" className="ghost" onClick={onCancelDelete}>
                      Keep
                    </button>
                    <button
                      type="button"
                      className="danger"
                      data-testid="confirm-delete"
                      onClick={() => onConfirmDelete(item.id)}
                    >
                      Delete project
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="ghost danger-ghost"
                  data-testid="delete-project"
                  onClick={() => onAskDelete(item.id)}
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
