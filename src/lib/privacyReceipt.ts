import type { FontSubstitution, PhotoCredit, PrivacyReceipt, ReceiptTraceStep, Telemetry } from "./types";

export const PRIVACY_DISCLAIMER =
  "Privacy Shield redacts configured confidential fields and detected emails or phone numbers before any cloud transmission. It does not guarantee full anonymization of arbitrary free-text context. Projects are stored in this browser (IndexedDB / localStorage); that storage is local, not end-to-end encrypted.";

export function makeSessionId(): string {
  const n = Math.floor(100 + Math.random() * 900);
  return `AB-${n}`;
}

export function receiptFromTelemetry(
  telemetry: Telemetry,
  sessionId = makeSessionId(),
  photoCredits?: PhotoCredit[],
  extras?: { fontMap?: FontSubstitution[]; executionTrace?: ReceiptTraceStep[] },
): PrivacyReceipt {
  return {
    sessionId,
    createdAt: new Date().toISOString(),
    badge: telemetry.badge,
    inferenceSource: telemetry.inferenceSource,
    model: telemetry.model,
    protectedFieldCount: telemetry.redactionCount,
    tokens: telemetry.tokens,
    cloudGenerationUsed: telemetry.cloudAttempted && telemetry.badge === "cloud",
    localRestoration: telemetry.badge === "cloud" && telemetry.redactionCount > 0,
    redactedPreview: telemetry.promptAfter,
    disclaimer: PRIVACY_DISCLAIMER,
    photoCredits: photoCredits?.length ? photoCredits : undefined,
    fontMap: extras?.fontMap?.length ? extras.fontMap : undefined,
    executionTrace: extras?.executionTrace?.length ? extras.executionTrace : undefined,
  };
}

export function receiptToMarkdown(receipt: PrivacyReceipt, projectName: string): string {
  const source =
    receipt.inferenceSource === "on_device"
      ? "On-Device"
      : receipt.inferenceSource === "in_cloud"
        ? "Cloud Hybrid"
        : receipt.badge === "error-fallback"
          ? "Local Fallback"
          : "Studio Preview";
  const fonts = receipt.fontMap?.length
    ? [
        "## Type substitutions",
        "",
        ...receipt.fontMap.map(
          (item) => `- ${item.role}: requested ${item.requested} → rendered ${item.rendered} (${item.status})`,
        ),
        "",
      ]
    : [];
  const trace = receipt.executionTrace?.length
    ? [
        "## Execution trace",
        "",
        ...receipt.executionTrace.map((step) => `- ${step.label} [${step.status}]: ${step.detail}`),
        "",
      ]
    : [];
  const credits = receipt.photoCredits?.length
    ? [
        "## Reference photograph credits",
        "",
        ...receipt.photoCredits.map(
          (photo) =>
            `- ${photo.alt} — ${photo.photographer} (${photo.photographerUrl}), ${photo.source}: ${photo.sourceUrl}, ${photo.license} (${photo.licenseUrl}). ${photo.subjectNote}`,
        ),
        "",
      ]
    : [];
  return [
    "# Atelier Brief — Privacy Receipt",
    "",
    `Project: ${projectName}`,
    `Session: ${receipt.sessionId}`,
    `Date: ${new Date(receipt.createdAt).toISOString()}`,
    `Inference source: ${source}`,
    `Model: ${receipt.model}`,
    `Protected fields: ${receipt.protectedFieldCount}`,
    `Placeholders: ${receipt.tokens.join(", ") || "—"}`,
    `Cloud generation used: ${receipt.cloudGenerationUsed ? "yes" : "no"}`,
    `Local restoration: ${receipt.localRestoration ? "yes" : "no"}`,
    "",
    "## Redacted cloud-bound preview",
    "",
    "```",
    receipt.redactedPreview || "—",
    "```",
    "",
    ...fonts,
    ...trace,
    ...credits,
    "## Scope",
    "",
    receipt.disclaimer,
    "",
  ].join("\n");
}

export function downloadReceipt(receipt: PrivacyReceipt, projectName: string) {
  const blob = new Blob([receiptToMarkdown(receipt, projectName)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const slug = (projectName || "atelier-brief").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  anchor.href = url;
  anchor.download = `${slug || "atelier-brief"}-privacy-receipt.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}
