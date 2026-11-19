import type { SitemapPage } from "../lib/types";

interface Props {
  pages: SitemapPage[];
  onChange: (pages: SitemapPage[]) => void;
}

export function SitemapBoard({ pages, onChange }: Props) {
  const update = (index: number, patch: Partial<SitemapPage>) => {
    onChange(pages.map((page, i) => (i === index ? { ...page, ...patch } : page)));
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= pages.length) return;
    const copy = [...pages];
    const [row] = copy.splice(index, 1);
    copy.splice(next, 0, row);
    onChange(copy);
  };

  const remove = (index: number) => {
    onChange(pages.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([
      ...pages,
      {
        id: crypto.randomUUID(),
        name: "New page",
        purpose: "Describe what this page must accomplish.",
        sections: ["Opening", "Proof", "Close"],
        heroCopy: "A plain sentence the page should be willing to stand on.",
      },
    ]);
  };

  return (
    <div className="sitemap" data-testid="sitemap-board">
      <div className="sitemap-intro">
        <div>
          <p className="label">Information architecture</p>
          <h2>Sitemap &amp; wireframes</h2>
        </div>
        <button type="button" className="ghost" data-testid="add-page" onClick={add}>
          Add page
        </button>
      </div>

      {!pages.length ? (
        <p className="reason">Compose a brief to generate a sitemap, or add a page by hand.</p>
      ) : (
        <div className="tree">
          {pages.map((page, index) => (
            <article className="page-card" key={page.id} data-page={page.id}>
              <header>
                <input
                  className="name"
                  value={page.name}
                  aria-label="Page name"
                  onChange={(event) => update(index, { name: event.target.value })}
                />
                <div className="page-tools">
                  <button type="button" className="icon-btn" aria-label="Move up" onClick={() => move(index, -1)}>
                    ↑
                  </button>
                  <button type="button" className="icon-btn" aria-label="Move down" onClick={() => move(index, 1)}>
                    ↓
                  </button>
                  <button type="button" className="icon-btn" aria-label="Remove page" onClick={() => remove(index)}>
                    ×
                  </button>
                </div>
              </header>
              <input
                className="plain"
                value={page.purpose}
                aria-label="Page purpose"
                onChange={(event) => update(index, { purpose: event.target.value })}
              />
              <textarea
                value={page.heroCopy}
                aria-label="Hero copy"
                onChange={(event) => update(index, { heroCopy: event.target.value })}
              />
              <input
                className="plain"
                value={page.sections.join(" · ")}
                aria-label="Page sections"
                onChange={(event) =>
                  update(index, {
                    sections: event.target.value
                      .split("·")
                      .map((part) => part.trim())
                      .filter(Boolean),
                  })
                }
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
