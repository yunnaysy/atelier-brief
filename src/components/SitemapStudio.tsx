import type { SitemapPage } from "../lib/types";

function newPage(name = "New page"): SitemapPage {
  return {
    id: crypto.randomUUID(),
    name,
    purpose: "Describe what this page must accomplish.",
    sections: ["Opening", "Proof", "Close"],
    heroCopy: "A plain sentence the page should be willing to stand on.",
    priority: false,
    conversionGoal: "",
    children: [],
  };
}

function mapTree(pages: SitemapPage[], id: string, fn: (page: SitemapPage) => SitemapPage | null): SitemapPage[] {
  const out: SitemapPage[] = [];
  for (const page of pages) {
    if (page.id === id) {
      const next = fn(page);
      if (next) out.push(next);
      continue;
    }
    out.push({ ...page, children: mapTree(page.children ?? [], id, fn) });
  }
  return out;
}

function moveInList(list: SitemapPage[], id: string, dir: -1 | 1): SitemapPage[] {
  const index = list.findIndex((page) => page.id === id);
  if (index === -1) {
    return list.map((page) => ({ ...page, children: moveInList(page.children ?? [], id, dir) }));
  }
  const next = index + dir;
  if (next < 0 || next >= list.length) return list;
  const copy = [...list];
  const [row] = copy.splice(index, 1);
  copy.splice(next, 0, row);
  return copy;
}

function Node({
  page,
  depth,
  onPatch,
  onRemove,
  onAddChild,
  onMove,
}: {
  page: SitemapPage;
  depth: number;
  onPatch: (id: string, patch: Partial<SitemapPage>) => void;
  onRemove: (id: string) => void;
  onAddChild: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  const children = page.children ?? [];
  return (
    <article className="tree-node" data-depth={depth} data-priority={page.priority ? "true" : "false"} data-page={page.id}>
      <details open>
        <summary className="tree-summary">
          <span className="tree-grip" aria-hidden="true" />
          <input
            className="name"
            value={page.name}
            aria-label="Page name"
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => onPatch(page.id, { name: event.target.value })}
          />
          <div className="page-tools">
            <button type="button" className="icon-btn" aria-label="Move up" onClick={() => onMove(page.id, -1)}>
              ↑
            </button>
            <button type="button" className="icon-btn" aria-label="Move down" onClick={() => onMove(page.id, 1)}>
              ↓
            </button>
            <button type="button" className="icon-btn" aria-label="Add child page" onClick={() => onAddChild(page.id)}>
              +
            </button>
            <button type="button" className="icon-btn" aria-label="Remove page" onClick={() => onRemove(page.id)}>
              ×
            </button>
          </div>
        </summary>
        <div className="tree-body">
          <label className="field">
            <span className="label">Purpose</span>
            <input
              className="plain"
              value={page.purpose}
              aria-label="Page purpose"
              onChange={(event) => onPatch(page.id, { purpose: event.target.value })}
            />
          </label>
          <label className="field">
            <span className="label">Hero copy</span>
            <textarea
              value={page.heroCopy}
              aria-label="Hero copy"
              onChange={(event) => onPatch(page.id, { heroCopy: event.target.value })}
            />
          </label>
          <label className="field">
            <span className="label">Conversion goal</span>
            <input
              className="plain"
              value={page.conversionGoal ?? ""}
              aria-label="Conversion goal"
              placeholder="What should this page earn?"
              onChange={(event) => onPatch(page.id, { conversionGoal: event.target.value })}
            />
          </label>
          <label className="priority-row">
            <input
              type="checkbox"
              checked={Boolean(page.priority)}
              aria-label="Mark as priority page"
              onChange={(event) => onPatch(page.id, { priority: event.target.checked })}
            />
            <span>Priority page</span>
          </label>
          {children.length ? (
            <div className="tree-children">
              {children.map((child) => (
                <Node
                  key={child.id}
                  page={child}
                  depth={depth + 1}
                  onPatch={onPatch}
                  onRemove={onRemove}
                  onAddChild={onAddChild}
                  onMove={onMove}
                />
              ))}
            </div>
          ) : null}
        </div>
      </details>
    </article>
  );
}

export function SitemapStudio({ pages, onChange }: { pages: SitemapPage[]; onChange: (pages: SitemapPage[]) => void }) {
  const patch = (id: string, next: Partial<SitemapPage>) => {
    onChange(mapTree(pages, id, (page) => ({ ...page, ...next })));
  };
  const remove = (id: string) => {
    onChange(mapTree(pages, id, () => null));
  };
  const addChild = (id: string) => {
    onChange(
      mapTree(pages, id, (page) => ({
        ...page,
        children: [...(page.children ?? []), newPage("Nested page")],
      })),
    );
  };

  return (
    <div className="sitemap" data-testid="sitemap-board">
      <div className="sitemap-intro">
        <div>
          <p className="label">Information architecture</p>
          <h2>Sitemap Studio</h2>
        </div>
        <button
          type="button"
          className="btn-secondary"
          data-testid="add-page"
          onClick={() => onChange([...pages, newPage()])}
        >
          Add page
        </button>
      </div>
      {!pages.length ? (
        <p className="reason">Compose a brief to generate a sitemap, or add a page by hand.</p>
      ) : (
        <div className="tree">
          {pages.map((page) => (
            <Node
              key={page.id}
              page={page}
              depth={0}
              onPatch={patch}
              onRemove={remove}
              onAddChild={addChild}
              onMove={(id, dir) => onChange(moveInList(pages, id, dir))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
