import type { BriefSection, DesignRationaleItem, Intake } from "../lib/types";

interface Props {
  intake: Intake;
  sections: BriefSection[];
  rationale: DesignRationaleItem[];
  busy: boolean;
  busySection: string | null;
  onEdit: (id: string, body: string) => void;
  onRegenerate: (id: string) => void;
}

function ComposeSkeleton({ intake }: { intake: Intake }) {
  return (
    <article className="canvas" data-testid="brief-canvas" aria-busy="true">
      <header className="doc-head">
        <div>
          <p className="label">Website brief</p>
          <h2>{intake.projectName || "Composing brief"}</h2>
          <div className="meta">
            {intake.clientName || "No client yet"}
            {intake.industry ? ` · ${intake.industry}` : ""}
            {intake.timeline ? ` · ${intake.timeline}` : ""}
          </div>
        </div>
      </header>
      <div className="compose-skeleton" data-testid="compose-skeleton" role="status" aria-live="polite">
        <p className="skeleton-status">Composing the brief…</p>
        {Array.from({ length: 5 }, (_, index) => (
          <div className="skeleton-block" key={index}>
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line skeleton-w96" />
            <div className="skeleton-line skeleton-w88" />
            <div className="skeleton-line skeleton-w72" />
          </div>
        ))}
      </div>
    </article>
  );
}

export function BriefCanvas({
  intake,
  sections,
  rationale,
  busy,
  busySection,
  onEdit,
  onRegenerate,
}: Props) {
  if (busy && !busySection) {
    return <ComposeSkeleton intake={intake} />;
  }

  if (!sections.length) {
    return (
      <div className="canvas doc-empty" data-testid="brief-canvas">
        <p className="label">Brief canvas</p>
        <h2>Set the intake, then compose a brief.</h2>
        <p>
          Load the sample project, choose a client, or write your own. Hybrid inference prefers Gemini Nano
          so names, budgets, and proprietary notes can stay on this computer. Cloud fallback, when you approve it,
          receives reversible Privacy Shield tokens only — not a promise of complete anonymization.
        </p>
      </div>
    );
  }

  return (
    <article className="canvas" data-testid="brief-canvas">
      <header className="doc-head">
        <div>
          <p className="label">Website brief</p>
          <h2>{intake.projectName || "Untitled brief"}</h2>
          <div className="meta">
            {intake.clientName || "No client yet"}
            {intake.industry ? ` · ${intake.industry}` : ""}
            {intake.timeline ? ` · ${intake.timeline}` : ""}
          </div>
        </div>
      </header>

      {sections.map((section, index) => (
        <section className="section" key={section.id} data-section={section.id}>
          <div className="section-head">
            <h3>
              <span className="section-index">{String(index + 1).padStart(2, "0")}</span>
              {section.title}
            </h3>
            <button
              type="button"
              className="ghost regen-btn"
              data-testid={`regen-${section.id}`}
              disabled={busy}
              onClick={() => onRegenerate(section.id)}
            >
              {busySection === section.id ? (
                "Regenerating…"
              ) : (
                <>
                  <span className="regen-full">Regenerate brief</span>
                  <span className="regen-short">Regenerate</span>
                </>
              )}
            </button>
          </div>
          <textarea
            className="section-body"
            value={section.body}
            aria-label={section.title}
            onChange={(event) => onEdit(section.id, event.target.value)}
          />
        </section>
      ))}

      {rationale.length ? (
        <section className="rationale" data-testid="design-rationale">
          <div className="section-head">
            <h3>
              <span className="section-index">{String(sections.length + 1).padStart(2, "0")}</span>
              Design Decisions
            </h3>
          </div>
          <p className="reason">
            Strategic recommendations from the same composition pass — so the brief reads like a design director,
            not a form.
          </p>
          <ol className="rationale-list">
            {rationale.map((item, index) => (
              <li key={`${item.recommendation}-${index}`}>
                <p className="rationale-title">
                  <span className="label">Design Decision / {String(index + 1).padStart(2, "0")}</span>
                  {item.recommendation}
                </p>
                <dl>
                  <div>
                    <dt>Reasoning</dt>
                    <dd>{item.reasoning}</dd>
                  </div>
                  <div>
                    <dt>Business objective</dt>
                    <dd>{item.businessObjective}</dd>
                  </div>
                  <div>
                    <dt>Implementation</dt>
                    <dd>{item.implementation}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </article>
  );
}
