import "server-only";

/**
 * Email sender. Real delivery runs through Resend when RESEND_API_KEY is set;
 * otherwise it logs and reports back that the provider is not configured, so
 * the digest flow still works in the keyless demo. Swapping providers changes
 * only this file.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<{ delivered: boolean; detail: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.BIOCODA_EMAIL_FROM ?? "BioCoda <noreply@biocoda.earth>";
  if (!key) {
    console.log(`[email] (not configured) would send to ${to}: ${subject}`);
    return {
      delivered: false,
      detail: `Email provider not configured. The digest for ${to} was generated; set RESEND_API_KEY to deliver it.`,
    };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      return { delivered: false, detail: `Email send failed (${res.status}).` };
    }
    return { delivered: true, detail: `Digest sent to ${to}.` };
  } catch (err) {
    return { delivered: false, detail: `Email send error: ${(err as Error).message}` };
  }
}
