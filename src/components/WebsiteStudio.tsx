import { useMemo, useState } from "react";
import { Download, Globe, Monitor, Smartphone } from "lucide-react";
import { Icon } from "./icons";
import { downloadHtmlFile, inlineSiteAssets, renderSiteHtml, siteFilename } from "../lib/siteRenderer";
import type { ArtDirection, GeneratedSite, InferenceBadge, Intake } from "../lib/types";
import { uniqueCredits } from "../lib/referencePhotos";

export function WebsiteStudio({
  intake,
  art,
  site,
  busy,
  canBuild,
  onBuild,
}: {
  intake: Intake;
  art: ArtDirection;
  site: GeneratedSite | null;
  busy: boolean;
  canBuild: boolean;
  onBuild: () => void;
}) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [downloading, setDownloading] = useState(false);
  const brand = intake.projectName || intake.clientName || "The House";
  const html = useMemo(() => {
    if (!site) return "";
    return renderSiteHtml(site.copy, art, {
      assetBase: typeof window !== "undefined" ? window.location.origin : "",
      documentTitle: brand,
      brandName: brand,
    });
  }, [site, art, brand]);

  const credits = site ? uniqueCredits(site.photoIds) : [];

  const onDownload = async () => {
    if (!html) return;
    setDownloading(true);
    try {
      const inlined = await inlineSiteAssets(html, window.location.origin);
      downloadHtmlFile(inlined, siteFilename(brand));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="website-studio" data-testid="website-studio">
      <div className="sitemap-intro">
        <p className="label">Website</p>
        <h2>Build a site from this brief</h2>
        <p>
          The studio writes page copy under Privacy Shield, then renders a multi-section website on this device —
          typography and colour from the art direction, photographs from a locally bundled, credited reference set.
        </p>
      </div>

      <div className="website-toolbar">
        <button
          type="button"
          className="btn-primary"
          data-testid="build-website"
          onClick={onBuild}
          disabled={busy || !canBuild}
        >
          <Icon as={Globe} size={16} />
          {busy ? "Building website…" : site ? "Rebuild website" : "Build website"}
        </button>
        <div className="viewport-toggle" role="group" aria-label="Preview size">
          <button
            type="button"
            data-testid="viewport-desktop"
            data-active={viewport === "desktop"}
            aria-pressed={viewport === "desktop"}
            onClick={() => setViewport("desktop")}
            disabled={!site}
          >
            <Icon as={Monitor} size={15} />
            Desktop
          </button>
          <button
            type="button"
            data-testid="viewport-mobile"
            data-active={viewport === "mobile"}
            aria-pressed={viewport === "mobile"}
            onClick={() => setViewport("mobile")}
            disabled={!site}
          >
            <Icon as={Smartphone} size={15} />
            Mobile
          </button>
        </div>
        <button
          type="button"
          className="btn-secondary"
          data-testid="download-html"
          onClick={() => void onDownload()}
          disabled={!site || downloading}
        >
          <Icon as={Download} size={16} />
          {downloading ? "Preparing file…" : "Download HTML"}
        </button>
      </div>

      {!canBuild && !site ? (
        <p className="website-hint" data-testid="website-need-brief">
          Generate a brief first. The website is written from the brief, sitemap, and art direction.
        </p>
      ) : null}

      {busy ? (
        <div className="website-skeleton" data-testid="website-skeleton" aria-busy="true">
          <div className="skel-hero" />
          <div className="skel-row" />
          <div className="skel-row short" />
        </div>
      ) : site ? (
        <>
          <div
            className="website-frame"
            data-testid="website-frame"
            data-viewport={viewport}
          >
            <iframe
              data-testid="site-preview"
              title="Generated website preview"
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups-to-escape-sandbox"
              srcDoc={html}
            />
          </div>
          {site.designDecisions?.length ? (
            <aside className="design-decisions" data-testid="design-decisions">
              <p className="label">Design decisions</p>
              <p className="website-hint-inline">How this brief became this site — not a template with a name inserted.</p>
              <dl>
                {site.designDecisions.map((item, index) => (
                  <div key={index}>
                    <dt>{item.from}</dt>
                    <dd>{item.to}</dd>
                  </div>
                ))}
              </dl>
              {site.fontMap?.length ? (
                <ul className="font-map" data-testid="site-font-map">
                  {site.fontMap.map((item) => (
                    <li key={item.role}>
                      {item.role}: {item.requested} → {item.rendered} ({item.status})
                    </li>
                  ))}
                </ul>
              ) : null}
              {site.paletteLog?.length ? (
                <p className="palette-log" data-testid="palette-log">{site.paletteLog.join(" ")}</p>
              ) : null}
            </aside>
          ) : null}
          <aside className="website-credits" data-testid="website-credits">
            <p className="label">Reference photographs</p>
            <ul>
              {credits.map((photo) => (
                <li key={photo.id}>
                  <span>{photo.alt}</span>
                  {" — "}
                  <a href={photo.photographerUrl} target="_blank" rel="noreferrer">
                    {photo.photographer}
                  </a>
                  {", "}
                  <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
                    {photo.source}
                  </a>
                  {", "}
                  <a href={photo.licenseUrl} target="_blank" rel="noreferrer">
                    {photo.license}
                  </a>
                  . {photo.subjectNote}
                </li>
              ))}
            </ul>
          </aside>
        </>
      ) : (
        <div className="website-empty" data-testid="website-empty">
          <Icon as={Globe} size={28} />
          <p>No site yet. Build one from the current brief — the preview will appear here, ready to download as a single HTML file.</p>
        </div>
      )}
    </section>
  );
}

export function websiteBadgeLabel(badge: InferenceBadge | undefined): string | null {
  if (!badge) return null;
  if (badge === "cloud") return "Cloud hybrid website";
  if (badge === "on-device") return "On-device website";
  if (badge === "preview") return "Local preview website";
  return "Local website (fallback)";
}
