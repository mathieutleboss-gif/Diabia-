# Diabia

Diabia est une application Next.js locale permettant d’importer et saisir des mesures glycémiques, de consulter des analyses informatives, de tenir un journal et d’interroger un assistant Ollama.

Les analyses et le score Diabia ne constituent pas un dispositif médical et ne remplacent pas l’avis d’un professionnel de santé.

## Installation

Prérequis : Node.js 20 ou supérieur et npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

L’application est ensuite disponible sur [http://localhost:3000](http://localhost:3000).

## Assistant local

L’assistant nécessite Ollama et utilise par défaut le modèle `llama3.2:3b` :

```bash
ollama pull llama3.2:3b
ollama serve
```

L’adresse et le modèle peuvent être adaptés dans `.env.local` avec `OLLAMA_URL` et `OLLAMA_MODEL`.

## Vérifications

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## Architecture

- `app/` : pages, composants et route serveur de l’assistant ;
- `lib/analyses/` : règles de statistiques, score, tendances et journal ;
- `lib/storage.ts` : persistance locale, migration, export et suppression ;
- `lib/validation.ts` : validation des données issues du navigateur ;
- `tests/` : tests de non-régression des règles principales.

Les clés historiques `mesures`, `journal` et `profil` sont conservées. La version de stockage est suivie séparément afin de permettre des migrations non destructives.

## Données et sécurité

Les données restent dans le `localStorage` du navigateur. Le rapport synthétique est transmis uniquement à l’instance Ollama configurée lorsque l’utilisateur interroge l’assistant. La page Profil permet d’exporter ou de supprimer les données locales.
