import { useEffect, useRef, useState } from "react";
import { downloadReceipt } from "../lib/privacyReceipt";
import type { PhotoCredit, PrivacyReceipt, Telemetry } from "../lib/types";
import { humanBadgeLabel } from "../lib/validateBundle";

function nanoLabel(value: Telemetry["nano"] | undefined, source?: string | null) {
  const usedOnDevice = source === "on_device";
  switch (value) {
    case "available":
      return usedOnDevice
        ? "Available · used for this brief"
        : "Reported by browser · not used for this brief";
    case "downloadable":
      return usedOnDevice ? "Downloadable · used for this brief" : "Downloadable · not used for this brief";
    case "downloading":
      return "Downloading Gemini Nano";
    case "unavailable":
      return "Unavailable in this browser";
    default:
      return "Unknown";
  }
}


const TOKEN_RE = /(\[[A-Z][A-Z0-9_]*\])/g;

/** Renders the exact cloudPrompt string; tokens are only highlighted, never rewritten. */
function PayloadBlock({ prompt, sent, testId }: { prompt: string; sent: boolean; testId: string }) {
  const preRef = useRef<HTMLPreElement>(null);
  useEffect(() => {
    const pre = preRef.current;
    const anchor = pre?.querySelector<HTMLElement>("[data-intake-anchor]");
    if (pre && anchor) pre.scrollTop = Math.max(0, anchor.offsetTop - pre.offsetTop - 8);
  }, [prompt]);
  const intakeAt = prompt.indexOf("Intake (");
  const head = intakeAt >= 0 ? prompt.slice(0, intakeAt) : prompt;
  const tail = intakeAt >= 0 ? prompt.slice(intakeAt) : "";
  const paint = (text: string, key: string) =>
    text.split(TOKEN_RE).map((part, index) =>
      index % 2 === 1 ? (
        <mark key={`${key}-${index}`} className="payload-token">{part}</mark>
      ) : (
        <span key={`${key}-${index}`}>{part}</span>
      ),
    );
  return (
    <figure className="sent-payload" data-testid="privacy-sent-payload" data-sent={sent ? "true" : "false"}>
      <figcaption className="payload-head">
        <span className="label">{sent ? "Payload sent to cloud" : "Payload prepared for cloud (not sent)"}</span>
        <span className="payload-sub">
          Exact tokenized cloudPrompt{sent ? " from the request this session made" : ""} · {prompt.length.toLocaleString("en-US")} characters · tokens highlighted
        </span>
      </figcaption>
      <pre ref={preRef} data-testid={testId}>
        {paint(head, "h")}
        {tail ? <span data-intake-anchor="">{paint(tail, "t")}</span> : null}
      </pre>
    </figure>
  );
}

export function PrivacyDrawer({
  open,
  receipt,
  telemetry,
  projectName,
  onClose,
}: {
  open: boolean;
  receipt: PrivacyReceipt | null;
  telemetry: Telemetry | null;
  projectName: string;
  onClose: () => void;
}) {
  const [pane, setPane] = useState<"receipt" | "inspector">("receipt");
  const [deviceOpen, setDeviceOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setPane("receipt");
      setDeviceOpen(false);
    }
  }, [open]);

  if (!open) return null;

  const source = humanBadgeLabel(telemetry?.badge ?? receipt?.badge ?? "preview");

  const originalAccordion = telemetry?.promptBefore ? (
    <details
      className="device-original"
      data-testid="device-original"
      open={deviceOpen}
      onToggle={(event) => setDeviceOpen((event.target as HTMLDetailsElement).open)}
    >
      <summary>Restored on device (never sent)</summary>
      {deviceOpen ? <pre data-testid="privacy-before">{telemetry.promptBefore}</pre> : null}
    </details>
  ) : null;

  return (
    <div className="drawer-backdrop" data-testid="privacy-drawer" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-label="Privacy and AI" onClick={(event) => event.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <p className="label">Privacy &amp; AI</p>
            <h2>Privacy Receipt</h2>
          </div>
          <button type="button" className="ghost" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="drawer-tabs">
          <button type="button" data-active={pane === "receipt"} onClick={() => setPane("receipt")}>
            Privacy Receipt
          </button>
          <button type="button" data-active={pane === "inspector"} data-testid="inspector-toggle" onClick={() => setPane("inspector")}>
            Technical Inspector
          </button>
        </div>
        <div className="drawer-body">
          {pane === "receipt" ? (
            <div data-testid="privacy-receipt">
              {receipt ? (
                <>
                  <aside className="architecture-card" data-testid="hybrid-architecture">
                    <p className="label">How this brief is composed</p>
                    <ol>
                      <li>On this device, Privacy Shield replaces configured confidential fields and detected emails or phones with reversible tokens.</li>
                      <li>If Chrome 139+ has Gemini Nano available, the brief can be composed on-device with the original values. That path is only claimed when the receipt badges it as on-device.</li>
                      <li>Otherwise, with your consent, only the tokenized payload is sent to Firebase AI Logic in the cloud (Gemini 3.5 Flash-Lite on the Spark free tier). Tokens are restored locally after the response.</li>
                      <li>App Check may be configured on this project. Enforcement is off, so App Check tokens are not claimed as verified.</li>
                    </ol>
                  </aside>
                  <dl className="inspector-grid">
                    <div><dt>Session</dt><dd>{receipt.sessionId}</dd></div>
                    <div><dt>Inference source</dt><dd data-testid="inspector-source">{source}</dd></div>
                    <div><dt>Model</dt><dd>{receipt.model}</dd></div>
                    <div><dt>Protected fields</dt><dd>{receipt.protectedFieldCount}</dd></div>
                    <div><dt>Cloud generation</dt><dd>{receipt.cloudGenerationUsed ? "Used" : "Not used"}</dd></div>
                    <div><dt>Local restoration</dt><dd>{receipt.localRestoration ? "Tokens restored on this device" : "Not required"}</dd></div>
                  </dl>
                  {telemetry?.promptAfter ? (
                    <PayloadBlock prompt={telemetry.promptAfter} sent={telemetry.cloudAttempted} testId="privacy-after-receipt" />
                  ) : null}
                  {originalAccordion}
                  <p className="reason">{receipt.disclaimer}</p>
                  {receipt.tokens.length ? (
                    <p className="reason">Placeholders: {receipt.tokens.join(", ")}</p>
                  ) : null}
                  {receipt.photoCredits?.length ? (
                    <div className="receipt-credits" data-testid="receipt-photo-credits">
                      <p className="label">Reference photograph credits</p>
                      <ul>
                        {receipt.photoCredits.map((photo: PhotoCredit) => (
                          <li key={photo.id}>
                            {photo.alt} — <a href={photo.photographerUrl} target="_blank" rel="noreferrer">{photo.photographer}</a>
                            {", "}
                            <a href={photo.sourceUrl} target="_blank" rel="noreferrer">{photo.source}</a>
                            {", "}
                            <a href={photo.licenseUrl} target="_blank" rel="noreferrer">{photo.license}</a>.
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {receipt.executionTrace?.length ? (
                    <div className="receipt-trace" data-testid="receipt-trace">
                      <p className="label">Execution trace</p>
                      <ol>
                        {receipt.executionTrace.map((step) => (
                          <li key={step.id} data-status={step.status}>
                            <strong>{step.label}</strong>
                            <span> · {step.status}</span>
                            <p>{step.detail}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}
                  {receipt.fontMap?.length ? (
                    <div className="receipt-fonts" data-testid="receipt-font-map">
                      <p className="label">Type in the rendered site</p>
                      <ul>
                        {receipt.fontMap.map((item) => (
                          <li key={item.role}>
                            {item.role}: requested {item.requested} → rendered {item.rendered} ({item.status})
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="btn-primary"
                    data-testid="export-receipt"
                    onClick={() => downloadReceipt(receipt, projectName)}
                  >
                    Export Privacy Receipt
                  </button>
                </>
              ) : (
                <p className="reason">Compose a brief to issue a Privacy Receipt for this session.</p>
              )}
            </div>
          ) : (
            <div data-testid="hybrid-inspector">
              {telemetry ? (
                <>
                  <dl className="inspector-grid">
                    <div><dt>Inference source</dt><dd>{telemetry.inferenceSource ?? "none (non-AI or failed)"}</dd></div>
                    <div><dt>Model</dt><dd>{telemetry.model}</dd></div>
                    <div><dt>Chrome 139+ / Gemini Nano</dt><dd>{nanoLabel(telemetry.nano, telemetry.inferenceSource)}</dd></div>
                    <div>
                      <dt>Device model</dt>
                      <dd>
                        {telemetry.devicePrepared ? "Initialized" : "Not initialized"}
                        {telemetry.deviceProgress != null ? ` · ${telemetry.deviceProgress}%` : ""}
                      </dd>
                    </div>
                    <div><dt>Cloud network request</dt><dd>{telemetry.cloudAttempted ? "Yes — a cloud request was sent" : "No cloud request"}</dd></div>
                    <div><dt>Latency</dt><dd>{telemetry.latencyMs} ms</dd></div>
                    <div>
                      <dt>Schema validation</dt>
                      <dd data-testid="inspector-schema">
                        {telemetry.schemaValid ? "Passed" : "Failed"}
                        {telemetry.schemaErrors.length ? ` — ${telemetry.schemaErrors.join(" ")}` : ""}
                      </dd>
                    </div>
                    <div>
                      <dt>Request result</dt>
                      <dd>
                        {telemetry.success ? "Succeeded" : "Failed"}
                        {telemetry.errorMessage ? ` — ${telemetry.errorMessage}` : ""}
                      </dd>
                    </div>
                  </dl>
                  <div className="diff" data-testid="privacy-diff">
                    <div className="diff-head">
                      <p className="label">Redaction · {telemetry.redactionCount} field{telemetry.redactionCount === 1 ? "" : "s"}</p>
                      <p className="reason" style={{ margin: 0 }}>
                        The block below is the exact tokenized prompt prepared for Firebase AI Logic
                        {telemetry.cloudAttempted ? " and sent when cloud generation was used" : " (no cloud request was sent for this session)"}.
                        This is not a guarantee of full anonymization of arbitrary free-text context.
                      </p>
                    </div>
                    <PayloadBlock prompt={telemetry.promptAfter || "—"} sent={telemetry.cloudAttempted} testId="privacy-after" />
                    {originalAccordion}
                  </div>
                </>
              ) : (
                <p className="reason">Compose a brief to inspect the real inference path. This panel does not invent a cloud or on-device result.</p>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
