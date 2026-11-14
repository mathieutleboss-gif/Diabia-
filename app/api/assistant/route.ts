import { NextResponse } from "next/server";
import { authenticatedUser, cloudConfig, DEMO_QUESTIONS, reserveQuota, SYSTEM } from "../../../lib/ia/cloud";

export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
function json(body: object, status = 200, extra = {}) {
  return NextResponse.json(body, { status, headers: { ...headers, ...extra } });
}
export async function GET() {
  let configured = false;
  try { cloudConfig(); configured = true; } catch { /* Aucun appel réseau de vérification. */ }
  return json({ disponible: configured, mode: "demo", fournisseur: "Mistral", limites: { parJour: 10, parMinute: 2 }, message: "Démonstration sur données fictives uniquement. Connexion par compte requise." });
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Origine de requête non autorisée." }, 403);
  if (Number(request.headers.get("content-length") || 0) > 4096) return json({ error: "La requête est trop volumineuse." }, 413);
  let body: Record<string, unknown>;
  try {
    // Lecture bornée, même sans Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Question absente." }, 400);
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); return json({ error: "La requête est trop volumineuse." }, 413); }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("JSON invalide");
  } catch { return json({ error: "Requête JSON incorrecte." }, 400); }
  if (Object.keys(body).some(key => key !== "questionId") || typeof body.questionId !== "string" || !Object.hasOwn(DEMO_QUESTIONS, body.questionId)) {
    return json({ error: "Seules les questions de démonstration sont autorisées. Aucune donnée personnelle ne doit être envoyée." }, 400);
  }
  let config: ReturnType<typeof cloudConfig>;
  try { config = cloudConfig(); } catch { return json({ error: "Assistant désactivé : clé, offre gratuite, authentification et quotas doivent être configurés." }, 503); }
  const user = authenticatedUser(request, config.authSecret);
  if (!user) return json({ error: "Connecte-toi à un compte pour utiliser l’assistant." }, 401);
  try {
    const quota = await reserveQuota(user, config);
    if (!quota.allowed) return json({ error: "Limite de demandes atteinte. Réessaie plus tard." }, 429, { "Retry-After": String(quota.retryAfter) });
    // Pas de question libre, rapport, journal ou profil utilisateur dans cet appel.
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST", headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.model, temperature: 0.1, max_tokens: 600, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: DEMO_QUESTIONS[body.questionId as keyof typeof DEMO_QUESTIONS] }] }),
      signal: AbortSignal.timeout(30_000), cache: "no-store",
    });
    // Les échecs restent comptabilisés ; aucune relance automatique ni bascule payante.
    if (response.status === 429) return json({ error: "Quota fournisseur atteint. Réessaie plus tard." }, 429, { "Retry-After": "60" });
    if (!response.ok) return json({ error: "Le fournisseur IA est temporairement indisponible." }, 502);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const reponse = data.choices?.[0]?.message?.content;
    if (typeof reponse !== "string" || !reponse.trim()) return json({ error: "Réponse IA vide." }, 502);
    return json({ reponse, mode: "demo" });
  } catch { return json({ error: "Assistant indisponible. Aucun nouvel appel ne sera effectué automatiquement." }, 503); }
}
