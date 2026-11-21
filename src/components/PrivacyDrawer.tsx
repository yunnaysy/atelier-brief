import { useState } from "react";
import { downloadReceipt } from "../lib/privacyReceipt";
import type { PrivacyReceipt, Telemetry } from "../lib/types";
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
  if (!open) return null;

  const source = humanBadgeLabel(telemetry?.badge ?? receipt?.badge ?? "preview");

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
                  <p className="reason">{receipt.disclaimer}</p>
                  {receipt.tokens.length ? (
                    <p className="reason">Placeholders: {receipt.tokens.join(", ")}</p>
                  ) : null}
                  {telemetry?.promptAfter ? (
                    <div className="sent-payload" data-testid="privacy-sent-payload">
                      <p className="label">
                        {telemetry.cloudAttempted
                          ? "Redacted payload sent to API"
                          : "Redacted payload prepared for API (not sent)"}
                      </p>
                      <pre data-testid="privacy-after-receipt">{telemetry.promptAfter}</pre>
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
                    <figure className="sent-figure">
                      <figcaption>
                        {telemetry.cloudAttempted
                          ? "Redacted payload sent to API"
                          : "Redacted payload prepared for API (not sent)"}
                      </figcaption>
                      <pre data-testid="privacy-after">{telemetry.promptAfter || "—"}</pre>
                    </figure>
                    <details className="device-original">
                      <summary>On-device original (not sent to the API)</summary>
                      <pre data-testid="privacy-before">{telemetry.promptBefore || "—"}</pre>
                    </details>
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
