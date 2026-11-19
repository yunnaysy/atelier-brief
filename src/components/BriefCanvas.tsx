import { TelemetryChip } from "./TelemetryChip";
import type { BriefSection, Intake, Telemetry } from "../lib/types";

interface Props {
  intake: Intake;
  sections: BriefSection[];
  telemetry: Telemetry | null;
  busy: boolean;
  busySection: string | null;
  onEdit: (id: string, body: string) => void;
  onRegenerate: (id: string) => void;
}

export function BriefCanvas({
  intake,
  sections,
  telemetry,
  busy,
  busySection,
  onEdit,
  onRegenerate,
}: Props) {
  if (!sections.length) {
    return (
      <div className="canvas doc-empty">
        <p className="label">Brief canvas</p>
        <h2>Set the intake, then compose a brief.</h2>
        <p>
          Choose a sample client or write your own. Hybrid inference prefers Gemini Nano
          so names, budgets, and proprietary notes can stay on this computer. Cloud
          fallback, when needed, receives reversible Privacy Shield tokens only.
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
        {telemetry ? <TelemetryChip telemetry={telemetry} compact /> : null}
      </header>

      {telemetry ? <p className="reason">{telemetry.reason}</p> : null}

      {sections.map((section, index) => (
        <section className="section" key={section.id} data-section={section.id}>
          <div className="section-head">
            <h3>
              <span className="section-index">{String(index + 1).padStart(2, "0")}</span>
              {section.title}
            </h3>
            <button
              type="button"
              className="ghost"
              data-testid={`regen-${section.id}`}
              disabled={busy}
              onClick={() => onRegenerate(section.id)}
            >
              {busySection === section.id ? (
                "Regenerating…"
              ) : (
                <>
                  <span className="regen-full">Regenerate with Hybrid AI</span>
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
    </article>
  );
}
