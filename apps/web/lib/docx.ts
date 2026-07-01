import "server-only";

/**
 * Extract raw text from a .docx file (base64). The Claude API does not accept
 * .docx as a document block, so we convert to plain text server-side and feed
 * that to the extraction engine. Uses mammoth.
 */
export async function docxToText(base64: string): Promise<string> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const mod: any = await import("mammoth");
  const mammoth = mod.default ?? mod;
  const buffer = Buffer.from(base64, "base64");
  const result = await mammoth.extractRawText({ buffer });
  return String(result?.value ?? "");
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export const DOCX_MEDIA_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
