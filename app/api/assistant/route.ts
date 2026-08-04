import { NextResponse } from "next/server";
import { creerPromptDiabia } from "../../../lib/ia/promptDiabia";

const OLLAMA_URL = "http://localhost:11434/api/chat";
const OLLAMA_MODEL = "llama3.2:3b";

type AssistantRequest = {
  question?: string;
  rapport?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AssistantRequest;
    const question = body.question?.trim();
    const rapport = body.rapport;

    if (!question) {
      return NextResponse.json({ error: "Écris une question avant de lancer l’analyse." }, { status: 400 });
    }

    if (!rapport || typeof rapport !== "object") {
      return NextResponse.json({ error: "Le rapport Diabia est absent ou incorrect." }, { status: 400 });
    }

    const prompt = creerPromptDiabia(question, rapport);
    const ollamaResponse = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
        { error: "Ollama n’a pas réussi à répondre. Vérifie qu’Ollama est ouvert et que llama3.2:3b est installé." },
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
      { error: "Impossible de contacter l’IA locale. Vérifie qu’Ollama fonctionne sur ton Mac." },
      { status: 500 }
    );
  }
}
