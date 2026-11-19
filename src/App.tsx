import { useEffect, useMemo, useState } from "react";
import { ArtDirectionSheet } from "./components/ArtDirectionSheet";
import { BriefCanvas } from "./components/BriefCanvas";
import { ExportHandoff } from "./components/ExportHandoff";
import { IntakeRail } from "./components/IntakeRail";
import { SitemapBoard } from "./components/SitemapBoard";
import { TelemetryChip } from "./components/TelemetryChip";
import {
  connectionLabel,
  detectNanoAvailability,
  generateStudioWork,
  isFirebaseConfigured,
} from "./lib/hybridAi";
import { copyText, downloadMarkdown, projectToMarkdown } from "./lib/markdown";
import { loadActiveId, loadProjects, saveActiveId, saveProjects } from "./lib/persistence";
import { CLIENT_PRESETS } from "./lib/presets";
import { planPrivacyShield } from "./lib/privacyShield";
import type { Intake, NanoAvailability, StudioProject, ToneId, WorkspaceTab } from "./lib/types";
import { newProject } from "./lib/types";

const TABS: { id: WorkspaceTab; label: string; short: string }[] = [
  { id: "brief", label: "Brief Canvas", short: "Brief" },
  { id: "sitemap", label: "Sitemap & Wireframes", short: "Sitemap" },
  { id: "art", label: "Art Direction", short: "Art" },
  { id: "export", label: "Export & Handoff", short: "Export" },
];

function presetIdFor(intake: Intake): string | null {
  const found = CLIENT_PRESETS.find(
    (preset) => preset.intake.clientName === intake.clientName && preset.intake.projectName === intake.projectName,
  );
  return found?.id ?? null;
}

export default function App() {
  const [projects, setProjects] = useState<StudioProject[]>(() => [newProject()]);
  const [activeId, setActiveId] = useState(projects[0].id);
  const [tab, setTab] = useState<WorkspaceTab>("brief");
  const [privacyShield, setPrivacyShield] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busySection, setBusySection] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [nano, setNano] = useState<NanoAvailability>("unknown");
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const configured = isFirebaseConfigured();
  const project = projects.find((item) => item.id === activeId) ?? projects[0];

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const saved = await loadProjects();
      const savedId = loadActiveId();
      if (cancelled) return;
      if (saved.length) {
        setProjects(saved);
        setActiveId(savedId && saved.some((item) => item.id === savedId) ? savedId : saved[0].id);
      }
      setHydrated(true);
      setNano(await detectNanoAvailability());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void saveProjects(projects);
    saveActiveId(activeId);
  }, [projects, activeId, hydrated]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  const link = useMemo(() => connectionLabel({ configured, nano }), [configured, nano]);
  const headerBadge = project.lastTelemetry
    ? project.lastTelemetry
    : {
        badge: configured ? ("cloud" as const) : ("preview" as const),
        label: link.hint,
      };

  const updateProject = (patch: Partial<StudioProject> | ((current: StudioProject) => StudioProject)) => {
    setProjects((current) =>
      current.map((item) => {
        if (item.id !== project.id) return item;
        const next = typeof patch === "function" ? patch(item) : { ...item, ...patch };
        return { ...next, updatedAt: new Date().toISOString() };
      }),
    );
  };

  const applyIntake = (intake: Intake) => updateProject({ intake });

  const toggleTone = (id: ToneId) => {
    const tones = project.intake.tones.includes(id)
      ? project.intake.tones.filter((tone) => tone !== id)
      : [...project.intake.tones, id];
    applyIntake({ ...project.intake, tones });
  };

  const applyPreset = (id: string) => {
    const preset = CLIENT_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    updateProject({ intake: { ...preset.intake } });
  };

  const compose = async (sectionId?: string) => {
    if (!project.intake.clientName && !project.intake.projectName) {
      setToast("Add a project or client name, or choose a sample client.");
      return;
    }
    setBusy(true);
    if (sectionId) setBusySection(sectionId);
    try {
      const result = await generateStudioWork({
        intake: project.intake,
        privacyShield,
        sectionId,
        currentSection: project.sections.find((section) => section.id === sectionId),
      });
      updateProject((current) => ({
        ...current,
        lastTelemetry: result.telemetry,
        sections: result.section
          ? current.sections.map((section) => (section.id === result.section?.id ? result.section : section))
          : result.bundle?.sections ?? current.sections,
        sitemap: result.bundle?.sitemap ?? current.sitemap,
        artDirection: result.bundle?.artDirection ?? current.artDirection,
      }));
      if (!sectionId) setTab("brief");
    } finally {
      setBusy(false);
      setBusySection(null);
    }
  };

  const onCopy = async () => {
    const ok = await copyText(projectToMarkdown(project));
    setToast(ok ? "Markdown copied." : "Could not copy. Try download instead.");
  };

  return (
    <div className="studio">
      <header className="header">
        <div className="brand">
          <div className="brand-mark">
            <span className="brand-kicker">Hybrid studio</span>
            <h1>Atelier Brief</h1>
          </div>
          <p>A design-first studio for client-safe website briefs.</p>
        </div>
        <div className="header-meta">
          <TelemetryChip telemetry={headerBadge} compact />
          <button
            type="button"
            className="shield-btn"
            aria-pressed={privacyShield}
            onClick={() => setPrivacyShield((value) => !value)}
          >
            Privacy Shield {privacyShield ? "on" : "off"}
            {privacyShield ? ` · ${planPrivacyShield(project.intake).fields.length}` : ""}
          </button>
        </div>
      </header>

      <div className="workspace">
        <IntakeRail
          intake={project.intake}
          privacyShield={privacyShield}
          busy={busy}
          collapsed={railCollapsed}
          activePresetId={presetIdFor(project.intake)}
          onToggleCollapsed={() => setRailCollapsed((value) => !value)}
          onChange={applyIntake}
          onToggleTone={toggleTone}
          onPreset={applyPreset}
          onToggleShield={() => setPrivacyShield((value) => !value)}
          onCompose={() => void compose()}
        />

        <main className="stage">
          <nav className="tabs" aria-label="Workspace">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="tab"
                data-tab={item.id}
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
              >
                <span className="tab-full">{item.label}</span>
                <span className="tab-short">{item.short}</span>
              </button>
            ))}
          </nav>
          <div className="tab-panel">
            {tab === "brief" ? (
              <BriefCanvas
                intake={project.intake}
                sections={project.sections}
                telemetry={project.lastTelemetry}
                busy={busy}
                busySection={busySection}
                onEdit={(id, body) =>
                  updateProject({
                    sections: project.sections.map((section) => (section.id === id ? { ...section, body } : section)),
                  })
                }
                onRegenerate={(id) => void compose(id)}
              />
            ) : null}
            {tab === "sitemap" ? (
              <SitemapBoard
                pages={project.sitemap}
                onChange={(sitemap) => updateProject({ sitemap })}
              />
            ) : null}
            {tab === "art" ? <ArtDirectionSheet art={project.artDirection} /> : null}
            {tab === "export" ? (
              <ExportHandoff
                project={project}
                projects={projects}
                onCopy={() => void onCopy()}
                onDownload={() => downloadMarkdown(project)}
                onPrint={() => window.print()}
                onOpen={(id) => {
                  setActiveId(id);
                  setTab("brief");
                }}
                onNew={() => {
                  const created = newProject();
                  setProjects((current) => [created, ...current]);
                  setActiveId(created.id);
                  setTab("brief");
                }}
              />
            ) : null}
          </div>
        </main>
      </div>
      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </div>
  );
}
