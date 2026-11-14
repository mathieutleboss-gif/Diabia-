import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";

export const DEMO_QUESTIONS = {
  moyenne: "Explique comment calculer une moyenne sur la série fictive 80, 100, 120, sans interprétation médicale.",
  dispersion: "Explique la dispersion de la série fictive 80, 100, 120, sans interprétation médicale.",
  limites: "Explique pourquoi trois valeurs fictives ne suffisent pas à conclure sur une tendance.",
} as const;
export const SYSTEM = "Réponds en français, en moins de 250 mots. Démonstration de statistiques sur des nombres fictifs sans unité. Aucun patient, aucun avis de santé, aucun diagnostic ni conseil de traitement. N'interprète jamais ces valeurs médicalement.";
export const RESERVED_TOKENS = 4096;

function positive(name: string): number {
  const value = Number(process.env[name]);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error("Configuration des quotas incomplète");
  return value;
}
export function cloudConfig() {
  const apiKey = process.env.MISTRAL_API_KEY;
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const authSecret = process.env.ASSISTANT_AUTH_SECRET;
  if (!apiKey || !redisUrl?.startsWith("https://") || !redisToken || !authSecret || authSecret.length < 32 || process.env.ASSISTANT_FREE_PLAN_CONFIRMED !== "true") throw new Error("Assistant non configuré");
  // Quotas réels du compte : marge de 20 %, sauf quota de requêtes égal à 1.
  const rpm = Math.min(Math.max(1, Math.floor(positive("MISTRAL_QUOTA_RPM") * .8)), Math.floor(positive("MISTRAL_QUOTA_TPM") * .8 / RESERVED_TOKENS));
  const rpd = Math.min(Math.max(1, Math.floor(positive("MISTRAL_QUOTA_RPD") * .8)), Math.floor(positive("MISTRAL_QUOTA_TPD") * .8 / RESERVED_TOKENS));
  if (rpm < 1 || rpd < 1) throw new Error("Quota insuffisant");
  return { apiKey, redisUrl, redisToken, authSecret, rpm, rpd, model: process.env.MISTRAL_MODEL || "mistral-small-latest" };
}

// L'identité doit venir d'une passerelle authentifiée, jamais du navigateur.
// Signature de timestamp + '\n' + identifiant de compte, HMAC-SHA256 hexadécimal.
export function authenticatedUser(request: Request, secret: string): string | null {
  const user = request.headers.get("x-diabia-user") || "";
  const timestamp = request.headers.get("x-diabia-timestamp") || "";
  const signature = request.headers.get("x-diabia-signature") || "";
  if (!/^[\w@.-]{1,128}$/.test(user) || !/^\d{13}$/.test(timestamp) || Math.abs(Date.now() - Number(timestamp)) > 60_000 || !/^[a-f0-9]{64}$/.test(signature)) return null;
  const expected = createHmac("sha256", secret).update(`${timestamp}\n${user}`).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex")) ? createHmac("sha256", secret).update(user).digest("hex") : null;
}

// Réservation atomique dans Redis partagé ; aucune remise à zéro lors d'un redéploiement.
// Fenêtres glissantes : elles protègent aussi chaque fenêtre calendaire du fournisseur.
export const RESERVE_SCRIPT = `
local nowParts = redis.call('TIME')
local now = tonumber(nowParts[1])*1000 + math.floor(tonumber(nowParts[2])/1000)
local windows = {60000,86400000,60000,86400000}
for i=1,4 do
  redis.call('ZREMRANGEBYSCORE',KEYS[i],'-inf',now-windows[i])
  if redis.call('ZCARD',KEYS[i]) >= tonumber(ARGV[i]) then
    local oldest = redis.call('ZRANGE',KEYS[i],0,0,'WITHSCORES')
    return {0,math.max(1,math.ceil((tonumber(oldest[2])+windows[i]-now)/1000))}
  end
end
for i=1,4 do
  redis.call('ZADD',KEYS[i],now,ARGV[5])
  redis.call('PEXPIRE',KEYS[i],windows[i]+1000)
end
return {1,0}
`;
export async function reserveQuota(user: string, config: ReturnType<typeof cloudConfig>) {
  const prefix = "diabia:{assistant}:";
  const keys = [`${prefix}global:minute`, `${prefix}global:day`, `${prefix}${user}:minute`, `${prefix}${user}:day`];
  const response = await fetch(config.redisUrl, {
    method: "POST", headers: { Authorization: `Bearer ${config.redisToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(["EVAL", RESERVE_SCRIPT, "4", ...keys, config.rpm, config.rpd, 2, 10, randomUUID()]),
    signal: AbortSignal.timeout(5000), cache: "no-store",
  });
  if (!response.ok) throw new Error("Compteur indisponible");
  const data = await response.json() as { result?: number[]; error?: string };
  if (data.error || !Array.isArray(data.result) || data.result.length !== 2 || ![0,1].includes(data.result[0]) || !Number.isFinite(data.result[1])) throw new Error("Compteur invalide");
  return { allowed: data.result[0] === 1, retryAfter: Math.max(1, data.result[1]) };
}
