import { useEffect, useState } from "react";
import { ArtDirectionSpecimen } from "./components/ArtDirectionSpecimen";
import { BottomNav, StageNav } from "./components/BottomNav";
import { BriefCanvas } from "./components/BriefCanvas";
import { ExportHandoff } from "./components/ExportHandoff";
import { IntakeRail } from "./components/IntakeRail";
import { Icon } from "./components/icons";
import { Layers } from "lucide-react";
import { PresentationView } from "./components/PresentationView";
import { PrivacyDrawer } from "./components/PrivacyDrawer";
import { ProjectHeader } from "./components/ProjectHeader";
import { SitemapStudio } from "./components/SitemapStudio";
import { WebsiteStudio } from "./components/WebsiteStudio";
import { StudioSidebar } from "./components/StudioSidebar";
import {
  generateStudioWork,
  generateWebsiteWork,
  isFirebaseConfigured,
} from "./lib/hybridAi";
import { copyText, downloadMarkdown, projectToMarkdown } from "./lib/markdown";
import { loadActiveId, loadProjects, saveActiveId, saveProjects } from "./lib/persistence";
import { CLIENT_PRESETS } from "./lib/presets";
import { planPrivacyShield } from "./lib/privacyShield";
import { receiptFromTelemetry } from "./lib/privacyReceipt";
import { uniqueCredits } from "./lib/referencePhotos";
import type { InferenceBadge, Intake, StudioProject, ToneId, WorkspaceTab } from "./lib/types";
import { newProject } from "./lib/types";
import { isConsentPending, statusStripCopy } from "./lib/validateBundle";

function presetIdFor(intake: Intake): string | null {
  const found = CLIENT_PRESETS.find(
    (preset) => preset.intake.clientName === intake.clientName && preset.intake.projectName === intake.projectName,
  );
  return found?.id ?? null;
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

  const badge: InferenceBadge | "idle" = project.lastTelemetry?.badge ?? "preview";
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


  const buildWebsite = async () => {
    if (!project.sections.length) {
      setToast("Generate a brief first, then build the website.");
      setTab("brief");
      return;
    }
    setBusy(true);
    try {
      const result = await generateWebsiteWork({
        intake: project.intake,
        sections: project.sections,
        sitemap: project.sitemap,
        artDirection: project.artDirection,
        privacyShield,
        cloudFallbackConsent: cloudConsent,
      });
      const credits = uniqueCredits(result.site.photoIds);
      const receipt = receiptFromTelemetry(result.telemetry, project.privacyReceipt?.sessionId, credits, {
        fontMap: result.site.fontMap,
        executionTrace: result.site.trace,
      });
      updateProject((current) => ({
        ...current,
        site: result.site,
        lastTelemetry: result.telemetry,
        privacyReceipt: receipt,
      }));
      setTab("site");
    } finally {
      setBusy(false);
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
        onJudgeDemo={() => void loadJudgeDemo()}
        demoBusy={busy}
      />

      <div className="shell">
        <ProjectHeader
          title={project.intake.projectName || "Untitled brief"}
          category={project.intake.industry}
          busy={busy}
          onPresent={enterPresentation}
          onCompose={() => void compose()}
        />

        <div className="project-strip" data-testid="project-strip">
          <div>
            <p className="label">Project details</p>
            <p className="strip-title">{project.intake.projectName || "Untitled brief"}</p>
            <p className="strip-line">
              {(project.intake.industry || "Independent practice").replace(/^Independent boutique hospitality$/i, "Hospitality")}
              {" · Website strategy"}
              {project.intake.timeline ? ` · ${project.intake.timeline.split(",")[0]}` : ""}
            </p>
            {project.intake.coreGoal ? (
              <p className="strip-goal">
                Primary goal:{" "}
                {presetIdFor(project.intake) === "aster-hotel"
                  ? "Increase direct reservations."
                  : project.intake.coreGoal}
              </p>
            ) : null}
            <button type="button" className="text-btn" data-testid="edit-details" onClick={() => setDetailsOpen(true)}>
              Edit project details
            </button>
          </div>
          {presetIdFor(project.intake) !== "aster-hotel" ? (
            <div className="strip-actions">
              <button type="button" className="btn-secondary" data-testid="judge-demo" onClick={() => void loadJudgeDemo()} disabled={busy}>
                <Icon as={Layers} size={16} />
                Load sample project
              </button>
            </div>
          ) : null}
        </div>

        <StageNav tab={tab} onTab={setTab} />

        <div className="status-strip" data-testid="status-strip" data-kind={badge}>
          <p>
            <span className="status-dot" aria-hidden="true" />
            <span>{statusStripCopy(badge, planCount, isConsentPending(project.lastTelemetry?.errorMessage, project.lastTelemetry?.cloudAttempted), cloudConsent)}</span>
          </p>
          <button type="button" className="text-btn" data-testid="privacy-pill" onClick={() => setPrivacyOpen(true)}>
            View details
          </button>
        </div>

        <main className="workspace-main" data-testid="workspace-main" data-tab={tab} key={tab}>
          {tab === "brief" ? (
            <BriefCanvas
              intake={project.intake}
              sections={project.sections}
              rationale={project.rationale}
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
          {tab === "site" ? (
            <WebsiteStudio
              intake={project.intake}
              art={project.artDirection}
              site={project.site}
              busy={busy}
              canBuild={project.sections.length > 0}
              onBuild={() => void buildWebsite()}
            />
          ) : null}
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
