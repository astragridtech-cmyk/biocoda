import "server-only";
import {
  MockPlanIngestionAdapter,
  type PlanIngestionInput,
} from "@biocoda/adapters";
import { PlanExtractionSchema, type PlanExtraction } from "@biocoda/shared";

/**
 * Runs plan extraction. Uses Claude (Opus 4.8) when ANTHROPIC_API_KEY is set
 * and BIOCODA_PLAN_REAL=1; otherwise the deterministic Mock so the flow is
 * demonstrable with no external keys. Swapping engines changes no calling code.
 */
export async function extractPlan(
  input: PlanIngestionInput,
): Promise<{ extraction: PlanExtraction; engine: "mock" | "anthropic" }> {
  if (process.env.ANTHROPIC_API_KEY && process.env.BIOCODA_PLAN_REAL === "1") {
    return { extraction: await extractWithClaude(input), engine: "anthropic" };
  }
  return { extraction: await new MockPlanIngestionAdapter().extract(input), engine: "mock" };
}

const SYSTEM = `You extract structured monitoring data from UK Biodiversity Net Gain documents (Habitat Management and Monitoring Plans, LEMPs, Biodiversity Gain Plans).
Extract every habitat parcel the plan commits to create, enhance, or maintain.
Use the Defra condition bands exactly: "poor", "moderate", or "good".
For each parcel record the management actions and any monitoring interval and method the plan states.
Provenance matters: for each parcel, set provenance.clause to the section or clause reference and provenance.quote to the sentence the target came from.
Do not invent biodiversity units: if the plan does not state targetUnits for a parcel, set it to null and add a warning naming that parcel.
Add a warning for anything you inferred, assumed, or could not find. Set confidence to your honest overall confidence between 0 and 1.`;

const INSTRUCTION = `Extract the full PlanExtraction from the document above. Include every habitat parcel with its baseline and target condition, the year the target must be reached, management actions, monitoring, and provenance.`;

/*
 * Loosely typed on purpose: the structured-output helpers (`messages.parse`,
 * `zodOutputFormat`) and content-block shapes vary across SDK minor versions,
 * and this path is gated behind a key we cannot exercise in CI. The result is
 * validated by `PlanExtractionSchema.parse`, which is the real type guarantee.
 */
async function extractWithClaude(input: PlanIngestionInput): Promise<PlanExtraction> {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const Anthropic = (await import("@anthropic-ai/sdk")).default as any;
  const zodHelpers = "@anthropic-ai/sdk/helpers/zod";
  const { zodOutputFormat } = (await import(zodHelpers)) as any;
  const client: any = new Anthropic();

  const content: any[] = [];
  if (input.base64 && input.mediaType === "application/pdf") {
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: input.base64 },
    });
  }
  if (input.text) content.push({ type: "text", text: input.text });
  content.push({ type: "text", text: INSTRUCTION });

  const res = await client.messages.parse({
    model: "claude-opus-4-8",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM,
    messages: [{ role: "user", content }],
    output_config: { format: zodOutputFormat(PlanExtractionSchema, "plan_extraction") },
  });

  const parsed = res.parsed_output ?? res.parsedOutput;
  if (!parsed) throw new Error("Claude returned no structured output for the plan");
  return PlanExtractionSchema.parse(parsed);
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
