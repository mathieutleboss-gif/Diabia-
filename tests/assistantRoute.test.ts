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
