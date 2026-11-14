import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/assistant/route";

test("la route assistant rejette une origine externe", async () => {
  const reponse = await POST(new Request("http://localhost/api/assistant", {
    method: "POST",
    headers: { origin: "https://exemple.invalid", "content-type": "application/json" },
    body: JSON.stringify({ question: "Test", rapport: {} }),
  }));

  assert.equal(reponse.status, 403);
});

test("la route assistant rejette une question absente", async () => {
  const reponse = await POST(new Request("http://localhost/api/assistant", {
    method: "POST",
    headers: { origin: "http://localhost", "content-type": "application/json" },
    body: JSON.stringify({ rapport: {} }),
  }));

  assert.equal(reponse.status, 400);
});

test("la route assistant rejette une taille annoncée excessive", async () => {
  const reponse = await POST(new Request("http://localhost/api/assistant", {
    method: "POST",
    headers: {
      origin: "http://localhost",
      "content-length": "250001",
      "content-type": "application/json",
    },
    body: JSON.stringify({ question: "Test", rapport: {} }),
  }));

  assert.equal(reponse.status, 413);
});

import { createHmac } from "node:crypto";
import { GET } from "../app/api/assistant/route";
import { authenticatedUser, cloudConfig, DEMO_QUESTIONS, RESERVED_TOKENS, SYSTEM } from "../lib/ia/cloud";

function configure() {
  Object.assign(process.env, {
    MISTRAL_API_KEY: "fake-key", MISTRAL_MODEL: "test-model",
    UPSTASH_REDIS_REST_URL: "https://redis.invalid", UPSTASH_REDIS_REST_TOKEN: "fake-token",
    ASSISTANT_AUTH_SECRET: "a".repeat(32), ASSISTANT_FREE_PLAN_CONFIRMED: "true",
    MISTRAL_QUOTA_RPM: "100", MISTRAL_QUOTA_RPD: "1000",
    MISTRAL_QUOTA_TPM: "51200", MISTRAL_QUOTA_TPD: "512000",
  });
}
function signedRequest(body: unknown) {
  const timestamp = String(Date.now());
  const signature = createHmac("sha256", process.env.ASSISTANT_AUTH_SECRET!).update(`${timestamp}\naccount-1`).digest("hex");
  return new Request("http://localhost/api/assistant", { method: "POST", headers: {
    origin: "http://localhost", "content-type": "application/json", "x-diabia-user": "account-1", "x-diabia-timestamp": timestamp, "x-diabia-signature": signature,
  }, body: JSON.stringify(body) });
}

test("les données personnelles et les questions libres sont bloquées sans appel réseau", async () => {
  configure();
  const original = global.fetch; let calls = 0;
  global.fetch = async () => { calls++; throw new Error("Aucun réseau attendu"); };
  try {
    for (const body of [{ questionId: "moyenne", rapport: { note: "confidentiel" } }, { questionId: "diagnostic" }, { question: "mon nom" }, null, [], { questionId: "__proto__" }]) {
      assert.equal((await POST(signedRequest(body))).status, 400);
    }
    const oversized = new Request("http://localhost/api/assistant", { method: "POST", body: "a".repeat(4097) });
    assert.equal((await POST(oversized)).status, 413);
    assert.equal(calls, 0);
  } finally { global.fetch = original; }
});

test("la configuration manquante ou l'identité non signée bloque le fournisseur", async () => {
  configure();
  assert.equal((await POST(new Request("http://localhost/api/assistant", { method: "POST", headers: { "x-diabia-user": "fake" }, body: JSON.stringify({ questionId: "moyenne" }) }))).status, 401);
  delete process.env.MISTRAL_QUOTA_RPM;
  assert.equal((await POST(signedRequest({ questionId: "moyenne" }))).status, 503);
  const status = await (await GET()).json();
  assert.equal(status.disponible, false);
});

test("la signature est vérifiée et expire après 60 secondes", () => {
  configure();
  const secret = process.env.ASSISTANT_AUTH_SECRET!;
  const valid = signedRequest({ questionId: "moyenne" });
  assert.ok(authenticatedUser(valid, secret));
  valid.headers.set("x-diabia-user", "another-account");
  assert.equal(authenticatedUser(valid, secret), null);
  const expired = signedRequest({});
  const timestamp = String(Date.now() - 61_000);
  expired.headers.set("x-diabia-timestamp", timestamp);
  expired.headers.set("x-diabia-signature", createHmac("sha256", secret).update(`${timestamp}\naccount-1`).digest("hex"));
  assert.equal(authenticatedUser(expired, secret), null);
});

test("les tokens et la marge réduisent le plafond global", () => {
  configure();
  assert.equal(cloudConfig().rpm, 10);
  assert.equal(cloudConfig().rpd, 100);
  for (const question of Object.values(DEMO_QUESTIONS)) {
    // Les octets UTF-8 fournissent une borne pessimiste pour ces prompts fixes.
    assert.ok(Buffer.byteLength(SYSTEM + question) + 600 + 256 < RESERVED_TOKENS);
  }
});

test("un quota épuisé ou Redis indisponible empêche l'appel IA", async () => {
  configure();
  const original = global.fetch; let calls = 0;
  global.fetch = async (url) => {
    calls++; assert.equal(url, "https://redis.invalid");
    return Response.json({ result: [0, 3600] });
  };
  try {
    const response = await POST(signedRequest({ questionId: "moyenne" }));
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("Retry-After"), "3600");
    assert.equal(calls, 1);
    global.fetch = async () => { throw new Error("Redis coupé"); };
    assert.equal((await POST(signedRequest({ questionId: "moyenne" }))).status, 503);
  } finally { global.fetch = original; }
});

test("la réservation précède Mistral et seul le texte fictif est envoyé, sans retry", async () => {
  configure();
  const original = global.fetch; const calls: string[] = [];
  global.fetch = async (url, init) => {
    calls.push(String(url));
    const body = JSON.parse(String(init?.body));
    if (calls.length === 1) {
      assert.equal(body[0], "EVAL");
      assert.deepEqual(body.slice(-5,-1), [10, 100, 2, 10]);
      return Response.json({ result: [1, 0] });
    }
    assert.equal(url, "https://api.mistral.ai/v1/chat/completions");
    assert.equal(body.max_tokens, 600);
    assert.equal(body.messages[1].content, DEMO_QUESTIONS.moyenne);
    return Response.json({ error: "provider limit" }, { status: 429 });
  };
  try {
    assert.equal((await POST(signedRequest({ questionId: "moyenne" }))).status, 429);
    assert.equal(calls.length, 2);
  } finally { global.fetch = original; }
});

test("la réponse Mistral est retournée sans exposer les secrets", async () => {
  configure();
  const original = global.fetch;
  global.fetch = async url => String(url).includes("redis.invalid") ? Response.json({ result: [1,0] }) : Response.json({ choices: [{ message: { content: "La moyenne est 100." } }] });
  try {
    const response = await POST(signedRequest({ questionId: "moyenne" }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { reponse: "La moyenne est 100.", mode: "demo" });
  } finally { global.fetch = original; }
});

test("un quota d'une requête par minute reste utilisable sans dépasser un appel", () => {
  configure();
  process.env.MISTRAL_QUOTA_RPM = "1";
  assert.equal(cloudConfig().rpm, 1);
});
