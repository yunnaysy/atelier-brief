import { useState } from "react";
import { contrastRatio, wcagLabel } from "../lib/artDirection";
import { copyText } from "../lib/markdown";
import type { ArtDirection } from "../lib/types";

function cssVariables(art: ArtDirection): string {
  const lines = [
    ":root {",
    `  --display: ${art.displayFamily}, "Times New Roman", serif;`,
    `  --body: ${art.bodyFamily}, "Helvetica Neue", Helvetica, Arial, sans-serif;`,
    `  --mono: ${art.monoFamily}, ui-monospace, Menlo, monospace;`,
  ];
  art.palette.forEach((color) => {
    const token = color.role.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    lines.push(`  --color-${token}: ${color.hex};`);
  });
  lines.push("}");
  return lines.join("\n") + "\n";
}

export function ArtDirectionSpecimen({ art }: { art: ArtDirection }) {
  const [copied, setCopied] = useState<string | null>(null);
  const paper = art.palette.find((color) => /field|paper|ivory|alabaster|cream|vellum|plaster/i.test(color.role + color.name))?.hex
    ?? art.palette[0]?.hex
    ?? "#F7F5F0";
  const ink = art.palette.find((color) => /text|ink|charcoal|espresso/i.test(color.role + color.name))?.hex
    ?? art.palette[1]?.hex
    ?? "#25241F";

  const flash = async (value: string, label: string) => {
    const ok = await copyText(value);
    setCopied(ok ? label : "Copy failed");
    window.setTimeout(() => setCopied(null), 1600);
  };

  return (
    <div className="canvas specimen-sheet" data-testid="art-direction">
      <div className="sitemap-intro">
        <div>
          <p className="label">Art direction</p>
          <h2>Typography Specimen &amp; Color Study</h2>
        </div>
        <button
          type="button"
          className="btn-secondary"
          data-testid="copy-css-vars"
          onClick={() => void flash(cssVariables(art), "CSS variables copied.")}
        >
          Copy CSS Variables
        </button>
      </div>

      <div className="specimen" style={{ fontFamily: art.bodyFamily }}>
        <p className="display" style={{ fontFamily: art.displayFamily }}>
          {art.hierarchy[0]?.sample || "Atelier"}
        </p>
        <p className="alphabet" style={{ fontFamily: art.displayFamily }}>
          Aa Bb Cc Dd Ee Ff Gg &nbsp; ABCDEFGHIJKLMNOPQRSTUVWXYZ &nbsp; 0123456789
        </p>
        <p className="lede">{art.narrative}</p>
      </div>

      <div className="swatch-row" style={{ marginTop: "1.5rem" }}>
        <p className="label">Color study — click a swatch to copy its hex</p>
        <div className="swatches">
          {art.palette.map((color) => {
            const vsPaper = contrastRatio(color.hex, paper);
            const vsInk = contrastRatio(color.hex, ink);
            const large = !/text|ink/i.test(color.role);
            return (
              <button
                type="button"
                className="swatch"
                key={`${color.name}-${color.hex}`}
                onClick={() => void flash(color.hex, `${color.hex} copied.`)}
                aria-label={`Copy ${color.name} ${color.hex}`}
              >
                <div className="chip-color" style={{ background: color.hex }} />
                <dl>
                  <dt>{color.name}</dt>
                  <dd>
                    {color.role} · <span className="hex">{color.hex}</span>
                    <div className="contrast">{vsPaper < 1.2 ? "field surface" : `on field ${vsPaper.toFixed(2)} ${wcagLabel(vsPaper, large)}`}</div>
                    <div className="contrast">{vsInk < (large ? 2.2 : 1.2) ? "near ink" : `on ink ${vsInk.toFixed(2)} ${wcagLabel(vsInk, large)}`}</div>
                  </dd>
                </dl>
              </button>
            );
          })}
        </div>
      </div>


      <div className="component-study" style={{ background: paper, color: ink }}>
        <p className="label">Component study</p>
        <p className="component-kicker">Button and card preview</p>
        <h3 style={{ fontFamily: art.displayFamily }}>Discover the property.</h3>
        <p>Explore rooms, amenities and the experience, using the proposed palette.</p>
        <div className="component-actions">
          <span
            className="component-btn primary"
            style={{
              background: art.palette.find((c) => /accent/i.test(c.role))?.hex ?? ink,
              color: paper,
            }}
          >
            Explore rooms
          </span>
          <span className="component-btn secondary" style={{ color: ink, borderColor: ink }}>
            View availability
          </span>
        </div>
        <aside className="component-card" style={{ borderColor: art.palette.find((c) => /rule|secondary/i.test(c.role))?.hex ?? "#C5C1B6" }}>
          <strong style={{ fontFamily: art.displayFamily }}>A considered stay</strong>
          <span>Illustrative specimen for primary action, secondary action, and a hairline card.</span>
        </aside>
      </div>

      <div className="hierarchy" style={{ marginTop: "1.6rem" }}>
        <p className="label">Typographic hierarchy</p>
        {art.hierarchy.map((row) => (
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
                fontSize: row.role === "Display" ? "2.5rem" : row.role === "Section" ? "1.55rem" : "1rem",
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
      <div className="implementation-notes">
        <p className="label">Implementation notes</p>
        <p>
          Layout density is {art.density}. {art.motion} Prefer a 180ms fade, 1px borders, and respect for reduced-motion settings.
        </p>
      </div>
      {copied ? <div className="toast inline-toast" role="status">{copied}</div> : null}
    </div>
  );
}
