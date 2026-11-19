import { flattenSitemap } from "../lib/validateBundle";
import { projectStamp } from "../lib/markdown";
import type { StudioProject } from "../lib/types";

export function PresentationView({
  project,
  showConfidential,
  onToggleConfidential,
  onExit,
  onPrint,
}: {
  project: StudioProject;
  showConfidential: boolean;
  onToggleConfidential: () => void;
  onExit: () => void;
  onPrint: () => void;
}) {
  const { date, version } = projectStamp(project);
  const pages = flattenSitemap(project.sitemap);

  return (
    <article className="presentation" data-testid="presentation-view">
      <div className="presentation-toolbar no-print">
        <button type="button" className="ghost" data-testid="exit-presentation" onClick={onExit}>
          Exit presentation
        </button>
        <label className="priority-row presentation-confidential">
          <input type="checkbox" checked={showConfidential} onChange={onToggleConfidential} />
          <span>Include internal client notes in this presentation</span>
        </label>
        <button type="button" className="btn-primary" onClick={onPrint}>
          Print to PDF
        </button>
      </div>
      <p className="presentation-confidential-hint no-print">These notes may contain sensitive information. Only include them if the recipient is authorized.</p>

      <section className="presentation-hero" data-testid="presentation-cover">
        <div className="presentation-hero-inner">
          <p className="hero-kicker">Atelier Brief</p>
          <h1>{project.intake.projectName || "Untitled brief"}</h1>
          <p className="lede">Website strategy &amp; creative direction</p>
        </div>
      </section>

      <div className="presentation-glass">
        <dl>
          <div><dt>Client</dt><dd>{project.intake.clientName || "—"}</dd></div>
          <div><dt>Category</dt><dd>{project.intake.industry || "—"}</dd></div>
          <div><dt>Date</dt><dd>{date}</dd></div>
          <div><dt>Version</dt><dd>{version}</dd></div>
        </dl>
      </div>

      <div className="presentation-body">
      <section>
        <p className="label">Goal</p>
        <p>{project.intake.coreGoal || "—"}</p>
        <p className="label" style={{ marginTop: "1.25rem" }}>Audience</p>
        <p>{project.intake.audience || "—"}</p>
        {showConfidential && project.intake.confidentialNotes.trim() ? (
          <div className="confidential-block">
            <p className="label">Confidential notes (opted in)</p>
            <p>{project.intake.confidentialNotes}</p>
          </div>
        ) : null}
      </section>

      {project.sections.map((section, index) => (
        <section key={section.id}>
          <h2>
            <span className="mono-index">{String(index + 1).padStart(2, "0")}</span>
            {section.title}
          </h2>
          {section.body.split("\n\n").map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
        </section>
      ))}

      {project.rationale.length ? (
        <section>
          <h2>Design Decisions</h2>
          <ol className="rationale-list">
            {project.rationale.map((item, index) => (
              <li key={`${item.recommendation}-${index}`}>
                <p className="rationale-title">
                  <span className="label">Design Decision / {String(index + 1).padStart(2, "0")}</span>
                  {item.recommendation}
                </p>
                <p>{item.reasoning}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {pages.length ? (
        <section>
          <h2>Sitemap</h2>
          <ol className="presentation-sitemap">
            {pages.map((page, index) => (
              <li key={page.id}>
                <strong>
                  {String(index + 1).padStart(2, "0")} {page.name}
                  {page.priority ? " · Priority" : ""}
                </strong>
                <span>{page.purpose}</span>
                {page.conversionGoal ? <em>{page.conversionGoal}</em> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section>
        <h2>Art Direction</h2>
        <p>{project.artDirection.narrative}</p>
        <div className="swatches">
          {project.artDirection.palette.map((color) => (
            <div className="swatch" key={color.hex}>
              <div className="chip-color" style={{ background: color.hex }} />
              <dl>
                <dt>{color.name}</dt>
                <dd>
                  {color.role} · <span className="hex">{color.hex}</span>
                </dd>
              </dl>
            </div>
          ))}
        </div>
      </section>
      </div>
    </article>
  );
}
