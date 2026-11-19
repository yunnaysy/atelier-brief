import { useEffect, useMemo, useState } from "react";
import { ArtDirectionSpecimen } from "./components/ArtDirectionSpecimen";
import { BottomNav } from "./components/BottomNav";
import { BriefCanvas } from "./components/BriefCanvas";
import { ExportHandoff } from "./components/ExportHandoff";
import { IntakeRail } from "./components/IntakeRail";
import { PresentationView } from "./components/PresentationView";
import { PrivacyDrawer } from "./components/PrivacyDrawer";
import { ProjectHeader } from "./components/ProjectHeader";
import { SitemapStudio } from "./components/SitemapStudio";
import { StudioSidebar } from "./components/StudioSidebar";
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
import { receiptFromTelemetry } from "./lib/privacyReceipt";
import type { InferenceBadge, Intake, NanoAvailability, StudioProject, ToneId, WorkspaceTab } from "./lib/types";
import { newProject } from "./lib/types";

function presetIdFor(intake: Intake): string | null {
  const found = CLIENT_PRESETS.find(
    (preset) => preset.intake.clientName === intake.clientName && preset.intake.projectName === intake.projectName,
  );
  return found?.id ?? null;
}

function filledFieldCount(intake: Intake): number {
  return [
    intake.projectName,
    intake.clientName,
    intake.industry,
    intake.budget,
    intake.timeline,
    intake.coreGoal,
    intake.audience,
    intake.confidentialNotes,
  ].filter((value) => value.trim()).length;
}

function presentationFlag(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("presentation") === "1";
}

function writePresentationFlag(on: boolean) {
  const url = new URL(window.location.href);
  if (on) url.searchParams.set("presentation", "1");
  else url.searchParams.delete("presentation");
  window.history.replaceState(null, "", url);
}

export default function App() {
  const [projects, setProjects] = useState<StudioProject[]>(() => [newProject()]);
  const [activeId, setActiveId] = useState(projects[0].id);
  const [tab, setTab] = useState<WorkspaceTab>("brief");
  const [privacyShield, setPrivacyShield] = useState(true);
  const [cloudConsent, setCloudConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busySection, setBusySection] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [nano, setNano] = useState<NanoAvailability>("unknown");
  const [hydrated, setHydrated] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [presenting, setPresenting] = useState(presentationFlag);
  const [showConfidential, setShowConfidential] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const link = useMemo(() => connectionLabel({ configured, nano }), [configured, nano]);
  const badge: InferenceBadge | "idle" = project.lastTelemetry?.badge ?? "preview";
  const fields = filledFieldCount(project.intake);
  const planCount = planPrivacyShield(project.intake).fields.length;

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

  const compose = async (sectionId?: string, intake: Intake = project.intake) => {
    if (!intake.clientName && !intake.projectName) {
      setToast("Add a project or client name, or load the judge demo.");
      return;
    }
    setBusy(true);
    if (sectionId) setBusySection(sectionId);
    try {
      const result = await generateStudioWork({
        intake,
        privacyShield,
        sectionId,
        currentSection: project.sections.find((section) => section.id === sectionId),
        cloudFallbackConsent: cloudConsent,
      });
      const receipt = receiptFromTelemetry(result.telemetry, project.privacyReceipt?.sessionId);
      updateProject((current) => ({
        ...current,
        lastTelemetry: result.telemetry,
        privacyReceipt: receipt,
        sections: result.section
          ? current.sections.map((section) => (section.id === result.section?.id ? result.section : section))
          : result.bundle?.sections ?? current.sections,
        sitemap: result.bundle?.sitemap ?? current.sitemap,
        artDirection: result.bundle?.artDirection ?? current.artDirection,
        rationale: result.bundle?.rationale ?? current.rationale,
      }));
      if (!sectionId) setTab("brief");
      setDetailsOpen(false);
    } finally {
      setBusy(false);
      setBusySection(null);
    }
  };

  const loadJudgeDemo = async () => {
    const preset = CLIENT_PRESETS.find((item) => item.id === "aster-hotel");
    if (!preset) return;
    updateProject({ intake: { ...preset.intake } });
    await compose(undefined, preset.intake);
  };

  const onCopy = async () => {
    const ok = await copyText(projectToMarkdown(project));
    setToast(ok ? "Markdown copied." : "Could not copy. Try download instead.");
  };

  const deleteProject = (id: string) => {
    setProjects((current) => {
      const remaining = current.filter((item) => item.id !== id);
      const next = remaining.length ? remaining : [newProject()];
      setActiveId((active) => (active === id ? next[0].id : active));
      return next;
    });
    setConfirmDeleteId(null);
    setTab("brief");
    setToast("Project deleted from this browser’s local archive.");
  };

  const createProject = () => {
    const created = newProject();
    setProjects((current) => [created, ...current]);
    setActiveId(created.id);
    setConfirmDeleteId(null);
    setTab("brief");
    setDetailsOpen(true);
    setPresenting(false);
    writePresentationFlag(false);
  };

  const enterPresentation = () => {
    setPresenting(true);
    writePresentationFlag(true);
    setPrivacyOpen(false);
    setDetailsOpen(false);
    setToast(null);
  };

  const exitPresentation = () => {
    setPresenting(false);
    writePresentationFlag(false);
  };

  if (presenting) {
    return (
      <div className="studio is-presenting">
        <PresentationView
          project={project}
          showConfidential={showConfidential}
          onToggleConfidential={() => setShowConfidential((value) => !value)}
          onExit={exitPresentation}
          onPrint={() => window.print()}
        />
        {toast ? <div className="toast" role="status">{toast}</div> : null}
      </div>
    );
  }

  return (
    <div className="studio">
      <StudioSidebar
        projects={projects}
        activeId={project.id}
        tab={tab}
        configured={configured}
        badge={badge}
        onTab={setTab}
        onOpen={(id) => {
          setActiveId(id);
          setConfirmDeleteId(null);
        }}
        onNew={createProject}
        onPrivacy={() => setPrivacyOpen(true)}
      />

      <div className="shell">
        <ProjectHeader
          title={project.intake.projectName || "Untitled brief"}
          category={project.intake.industry}
          badge={badge}
          label={project.lastTelemetry?.label ?? link.hint}
          onPrivacy={() => setPrivacyOpen(true)}
          onPresent={enterPresentation}
          onExport={() => setTab("export")}
        />

        <div className="project-strip" data-testid="project-strip">
          <div>
            <p className="strip-line">
              Project details · {fields} field{fields === 1 ? "" : "s"}
              {project.intake.projectName ? ` · ${project.intake.projectName}` : ""}
              {project.intake.industry ? ` · ${project.intake.industry}` : ""}
              {project.intake.coreGoal ? ` · ${project.intake.coreGoal}` : ""}
            </p>
            <button type="button" className="text-btn" data-testid="edit-details" onClick={() => setDetailsOpen(true)}>
              Edit project details
            </button>
          </div>
          <div className="strip-actions">
            <button type="button" className="btn-secondary" data-testid="judge-demo" onClick={() => void loadJudgeDemo()} disabled={busy}>
              Load Judge Demo: The Aster Hotel
            </button>
            <button type="button" className="btn-lime" data-testid="compose" onClick={() => void compose()} disabled={busy}>
              {busy ? "Composing…" : "Generate Brief"}
            </button>
          </div>
        </div>

        <div className="bento-row" data-testid="bento-row">
          <article className="bento bento-dark">
            <div className="bento-icon" aria-hidden="true">↗</div>
            <p className="label">Hybrid AI</p>
            <strong className="bento-accent">
              {badge === "on-device"
                ? "ON_DEVICE"
                : badge === "cloud"
                  ? "IN_CLOUD"
                  : badge === "error-fallback"
                    ? "LOCAL_FALLBACK_ERROR"
                    : "STUDIO_PREVIEW"}
            </strong>
            <span>
              {project.lastTelemetry
                ? `${project.lastTelemetry.latencyMs} ms · ${project.lastTelemetry.model}`
                : link.hint}
            </span>
          </article>
          <article className="bento bento-lime">
            <div className="bento-icon" aria-hidden="true">●</div>
            <p className="label">Privacy Shield</p>
            <strong>
              {planCount} field{planCount === 1 ? "" : "s"} protected
            </strong>
            <span>Configured confidential fields and detected emails or phones are tokenized before any cloud call.</span>
          </article>
          <article className="bento">
            <div className="bento-icon" aria-hidden="true">↘</div>
            <p className="label">Workspace</p>
            <strong>Saved locally</strong>
            <span>IndexedDB on this device · not end-to-end encrypted</span>
          </article>
        </div>

        <main className="workspace-main">
          {tab === "brief" ? (
            <BriefCanvas
              intake={project.intake}
              sections={project.sections}
              rationale={project.rationale}
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
            <SitemapStudio pages={project.sitemap} onChange={(sitemap) => updateProject({ sitemap })} />
          ) : null}
          {tab === "art" ? <ArtDirectionSpecimen art={project.artDirection} /> : null}
          {tab === "export" ? (
            <ExportHandoff
              project={project}
              projects={projects}
              confirmDeleteId={confirmDeleteId}
              onCopy={() => void onCopy()}
              onDownload={() => downloadMarkdown(project)}
              onPrint={() => window.print()}
              onOpen={(id) => {
                setActiveId(id);
                setConfirmDeleteId(null);
                setTab("brief");
              }}
              onNew={createProject}
              onAskDelete={(id) => setConfirmDeleteId(id)}
              onCancelDelete={() => setConfirmDeleteId(null)}
              onConfirmDelete={deleteProject}
            />
          ) : null}
        </main>
      </div>

      <BottomNav tab={tab} onTab={setTab} />

      {detailsOpen ? (
        <div className="drawer-backdrop" data-testid="details-drawer" onClick={() => setDetailsOpen(false)}>
          <aside className="drawer drawer-wide" role="dialog" aria-label="Project details" onClick={(event) => event.stopPropagation()}>
            <IntakeRail
              intake={project.intake}
              privacyShield={privacyShield}
              cloudConsent={cloudConsent}
              busy={busy}
              collapsed={false}
              activePresetId={presetIdFor(project.intake)}
              onToggleCollapsed={() => setDetailsOpen(false)}
              onChange={applyIntake}
              onToggleTone={toggleTone}
              onPreset={applyPreset}
              onJudgeDemo={() => void loadJudgeDemo()}
              onToggleShield={() => setPrivacyShield((value) => !value)}
              onToggleConsent={() => setCloudConsent((value) => !value)}
              onCompose={() => void compose()}
            />
          </aside>
        </div>
      ) : null}

      <PrivacyDrawer
        open={privacyOpen}
        receipt={project.privacyReceipt}
        telemetry={project.lastTelemetry}
        projectName={project.intake.projectName || "Untitled brief"}
        onClose={() => setPrivacyOpen(false)}
      />

      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </div>
  );
}
