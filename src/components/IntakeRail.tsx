import { CLIENT_PRESETS } from "../lib/presets";
import { planPrivacyShield } from "../lib/privacyShield";
import type { Intake, ToneId } from "../lib/types";
import { TONE_OPTIONS } from "../lib/types";

interface Props {
  intake: Intake;
  privacyShield: boolean;
  cloudConsent: boolean;
  busy: boolean;
  collapsed: boolean;
  activePresetId: string | null;
  onToggleCollapsed: () => void;
  onChange: (intake: Intake) => void;
  onToggleTone: (id: ToneId) => void;
  onPreset: (id: string) => void;
  onJudgeDemo: () => void;
  onToggleShield: () => void;
  onToggleConsent: () => void;
  onCompose: () => void;
}

export function IntakeRail({
  intake,
  privacyShield,
  cloudConsent,
  busy,
  collapsed,
  activePresetId,
  onToggleCollapsed,
  onChange,
  onToggleTone,
  onPreset,
  onJudgeDemo,
  onToggleShield,
  onToggleConsent,
  onCompose,
}: Props) {
  const plan = planPrivacyShield(intake);
  const confidential = plan.fields.length > 0;

  const set = <K extends keyof Intake>(key: K, value: Intake[K]) => {
    onChange({ ...intake, [key]: value });
  };

  return (
    <aside className="rail" data-collapsed={collapsed}>
      <div className="rail-head">
        <h2>Intake</h2>
        <button type="button" className="ghost mobile-toggle" onClick={onToggleCollapsed}>
          Close
        </button>
      </div>

      <div className="rail-body">
        <button
          type="button"
          className="judge-demo"
          data-testid="judge-demo-drawer"
          data-active={activePresetId === "aster-hotel"}
          onClick={onJudgeDemo}
          disabled={busy}
        >
          <span className="kicker label">Sample project</span>
          <strong>Load sample project</strong>
          <span>A realistic fictional client, including quotes, contacts, budget, and confidential notes.</span>
        </button>

        <p className="label" style={{ margin: "1.15rem 0 0.45rem" }}>
          Sample clients
        </p>
        <div className="presets">
          {CLIENT_PRESETS.filter((preset) => preset.id !== "aster-hotel").map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="preset"
              data-active={activePresetId === preset.id}
              data-preset={preset.id}
              onClick={() => onPreset(preset.id)}
            >
              <span className="kicker label">{preset.kicker}</span>
              <strong>{preset.title}</strong>
              <span>{preset.lede}</span>
            </button>
          ))}
        </div>

        <label className="field">
          <span className="label">Project</span>
          <input
            value={intake.projectName}
            onChange={(event) => set("projectName", event.target.value)}
            placeholder="Studio website"
          />
        </label>
        <label className="field">
          <span className="label">Client name</span>
          <input
            value={intake.clientName}
            onChange={(event) => set("clientName", event.target.value)}
            placeholder="Protected when Privacy Shield is on"
          />
        </label>
        <label className="field">
          <span className="label">Industry</span>
          <input
            value={intake.industry}
            onChange={(event) => set("industry", event.target.value)}
            placeholder="Independent practice"
          />
        </label>
        <label className="field">
          <span className="label">Budget</span>
          <input
            value={intake.budget}
            onChange={(event) => set("budget", event.target.value)}
            placeholder="A range, not a bid"
          />
        </label>
        <label className="field">
          <span className="label">Timeline</span>
          <input
            value={intake.timeline}
            onChange={(event) => set("timeline", event.target.value)}
            placeholder="Weeks to launch"
          />
        </label>

        <div className="field">
          <span className="label">Brand tone</span>
          <div className="chips">
            {TONE_OPTIONS.map((tone) => (
              <button
                key={tone.id}
                type="button"
                className="chip"
                data-on={intake.tones.includes(tone.id)}
                onClick={() => onToggleTone(tone.id)}
              >
                {tone.label}
              </button>
            ))}
          </div>
        </div>

        <label className="field slider">
          <span className="label">Voice reserve</span>
          <input
            type="range"
            min={0}
            max={100}
            value={intake.voiceReserve}
            onChange={(event) => set("voiceReserve", Number(event.target.value))}
          />
          <div className="slider-meta">
            <span>Reserved</span>
            <span>{intake.voiceReserve}</span>
            <span>Expressive</span>
          </div>
        </label>

        <label className="field">
          <span className="label">Core goal</span>
          <textarea
            value={intake.coreGoal}
            onChange={(event) => set("coreGoal", event.target.value)}
            placeholder="The one outcome this site must earn."
          />
        </label>
        <label className="field">
          <span className="label">Target audience</span>
          <textarea
            value={intake.audience}
            onChange={(event) => set("audience", event.target.value)}
            placeholder="Who is actually hiring or buying?"
          />
        </label>
        <label className="field">
          <span className="label">Confidential notes</span>
          <textarea
            value={intake.confidentialNotes}
            onChange={(event) => set("confidentialNotes", event.target.value)}
            placeholder="Names, addresses, pricing, contacts — tokenized before any cloud call."
          />
        </label>

        <div className="lock-row">
          <p>
            Privacy Shield is ready to tokenize {plan.fields.length} confidential field
            {plan.fields.length === 1 ? "" : "s"}
            {plan.fields.length ? ` (${plan.fields.map((field) => field.token).join(", ")})` : ""}.
            It redacts configured confidential fields and detected emails or phones before any cloud
            transmission. It does not guarantee full anonymization of arbitrary free-text context.
          </p>
          <button
            type="button"
            className="toggle"
            aria-pressed={privacyShield}
            aria-label="Toggle Privacy Shield"
            data-testid="privacy-toggle"
            onClick={onToggleShield}
          />
        </div>

        {confidential ? (
          <label className="consent" data-testid="cloud-consent">
            <input
              type="checkbox"
              checked={cloudConsent}
              onChange={onToggleConsent}
            />
            <span>
              Approve redacted cloud fallback if Gemini Nano is unavailable. The cloud model will receive
              the tokenized payload only — never unredacted names, budgets, or contacts from configured fields.
            </span>
          </label>
        ) : null}

        <button type="button" className="compose" data-testid="compose-drawer" onClick={onCompose} disabled={busy}>
          {busy ? "Composing…" : "Compose brief"}
        </button>
      </div>
    </aside>
  );
}
