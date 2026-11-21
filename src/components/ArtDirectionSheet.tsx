import { contrastRatio, wcagLabel } from "../lib/artDirection";
import type { ArtDirection } from "../lib/types";

export function ArtDirectionSheet({ art }: { art: ArtDirection }) {
  const paper = art.palette.find((color) => /field|paper|ivory|cream|vellum|plaster/i.test(color.role + color.name))?.hex
    ?? art.palette[0]?.hex
    ?? "#FFFFFF";
  const ink = art.palette.find((color) => /text|ink|espresso/i.test(color.role + color.name))?.hex
    ?? art.palette[1]?.hex
    ?? "#181715";

  return (
    <div className="canvas" data-testid="art-direction">
      <p className="label">Art direction</p>
      <div className="specimen">
        <p className="display" style={{ fontFamily: art.displayFamily }}>
          {art.hierarchy[0]?.sample || "Atelier"}
        </p>
        <p className="lede">{art.narrative}</p>
        <p className="reason">
          Density: {art.density}. {art.motion}
        </p>
      </div>

      <div className="swatch-row" style={{ marginTop: "1.25rem" }}>
        <p className="label">Palette &amp; contrast against the field and the ink</p>
        <div className="swatches">
          {art.palette.map((color) => {
            const vsPaper = contrastRatio(color.hex, paper);
            const vsInk = contrastRatio(color.hex, ink);
            const large = !/text|ink/i.test(color.role);
            const fieldNote = vsPaper < 1.2 ? "field surface" : `on field ${vsPaper.toFixed(2)} ${wcagLabel(vsPaper, large)}`;
            const inkNote = vsInk < (large ? 2.2 : 1.2) ? "near ink" : `on ink ${vsInk.toFixed(2)} ${wcagLabel(vsInk, large)}`;
            return (
              <div className="swatch" key={`${color.name}-${color.hex}`}>
                <div className="chip-color" style={{ background: color.hex }} />
                <dl>
                  <dt>{color.name}</dt>
                  <dd>
                    {color.role} · {color.hex}
                    <div className="contrast" data-pass={vsPaper < 1.2 ? "AAA" : wcagLabel(vsPaper, large)}>
                      {fieldNote}
                    </div>
                    <div className="contrast" data-pass={vsInk < (large ? 2.2 : 1.2) ? "AAA" : wcagLabel(vsInk, large)}>
                      {inkNote}
                    </div>
                  </dd>
                </dl>
              </div>
            );
          })}
        </div>
      </div>

      <div className="hierarchy" style={{ marginTop: "1.4rem" }}>
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
                fontSize: row.role === "Display" ? "2.4rem" : row.role === "Section" ? "1.5rem" : "1rem",
                fontWeight: Number(row.weight) || 400,
                letterSpacing: row.tracking,
                lineHeight: 1.15,
              }}
            >
              {row.sample}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
