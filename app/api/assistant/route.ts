import { NextResponse } from "next/server";
import { creerPromptDiabia } from "../../../lib/ia/promptDiabia";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/chat";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";
const MAX_QUESTION_LENGTH = 1_000;
const MAX_REQUEST_SIZE = 250_000;
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 10;

type RateLimitEntry = { count: number; resetAt: number };
const rateLimits = new Map<string, RateLimitEntry>();

type AssistantRequest = {
  question?: string;
  rapport?: unknown;
};

export async function GET() {
  try {
    const tagsUrl = new URL("/api/tags", OLLAMA_URL);
    const response = await fetch(tagsUrl, { signal: AbortSignal.timeout(3_000), cache: "no-store" });
    if (!response.ok) throw new Error("Ollama indisponible");
    const data = (await response.json()) as { models?: Array<{ name?: string }> };
    const modelDisponible = data.models?.some(({ name }) => name === OLLAMA_MODEL || name?.startsWith(`${OLLAMA_MODEL}:`)) ?? false;
    return NextResponse.json({ disponible: true, modele: OLLAMA_MODEL, modelDisponible });
  } catch {
    return NextResponse.json({ disponible: false, modele: OLLAMA_MODEL, modelDisponible: false });
  }
}

function obtenirAdresseClient(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function estLimite(request: Request): boolean {
  const maintenant = Date.now();
  if (rateLimits.size > 1_000) {
    for (const [adresse, entree] of rateLimits) {
      if (entree.resetAt <= maintenant) rateLimits.delete(adresse);
    }
  }
  const adresse = obtenirAdresseClient(request);
  const entree = rateLimits.get(adresse);

  if (!entree || entree.resetAt <= maintenant) {
    rateLimits.set(adresse, { count: 1, resetAt: maintenant + RATE_LIMIT_WINDOW });
    return false;
  }

  entree.count += 1;
  return entree.count > RATE_LIMIT_MAX;
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json({ error: "Origine de requête non autorisée." }, { status: 403 });
    }

    const tailleAnnoncee = Number(request.headers.get("content-length") || 0);
    if (tailleAnnoncee > MAX_REQUEST_SIZE) {
      return NextResponse.json({ error: "La requête est trop volumineuse." }, { status: 413 });
    }

    if (estLimite(request)) {
      return NextResponse.json(
        { error: "Trop de demandes successives. Réessaie dans une minute." },
        { status: 429 }
      );
    }

    const contenu = await request.text();
    if (contenu.length > MAX_REQUEST_SIZE) {
      return NextResponse.json({ error: "La requête est trop volumineuse." }, { status: 413 });
    }

    const body = JSON.parse(contenu) as AssistantRequest;
    const question = body.question?.trim();
    const rapport = body.rapport;

    if (!question) {
      return NextResponse.json({ error: "Écris une question avant de lancer l’analyse." }, { status: 400 });
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json(
        { error: "La question est trop longue (1 000 caractères maximum)." },
        { status: 400 }
      );
    }

    if (!rapport || typeof rapport !== "object") {
      return NextResponse.json({ error: "Le rapport Diabia est absent ou incorrect." }, { status: 400 });
    }

    const prompt = creerPromptDiabia(question, rapport);
    const ollamaResponse = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        keep_alive: "10m",
        options: { temperature: 0.1, num_predict: 300 },
        messages: [
          {
            role: "system",
            content: "Tu es Diabia. Tu expliques uniquement les données fournies, sans inventer et sans modifier de traitement.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!ollamaResponse.ok) {
      const details = await ollamaResponse.text();
      console.error("Erreur Ollama :", details);
      return NextResponse.json(
        { error: `Ollama n’a pas réussi à répondre. Vérifie qu’Ollama est ouvert et que ${OLLAMA_MODEL} est installé.` },
        { status: 502 }
      );
    }

    const data = (await ollamaResponse.json()) as { message?: { content?: string } };
    const reponse = data.message?.content?.trim();

    if (!reponse) {
      return NextResponse.json({ error: "Ollama a répondu, mais aucun texte n’a été généré." }, { status: 502 });
    }

    return NextResponse.json({ reponse });
  } catch (error) {
    console.error("Erreur assistant Diabia :", error);
    return NextResponse.json(
      { error: "Impossible de contacter l’IA. Vérifie qu’Ollama fonctionne sur la machine qui exécute Diabia." },
      { status: 500 }
    );
  }
}
