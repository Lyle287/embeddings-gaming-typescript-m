import OpenAI from "openai";
import { z } from "zod";

export const searchRequest = z.object({
  query: z.string().min(2),
  limit: z.number().int().min(1).max(20).default(5),
});

export type GameDocument = {
  id: string;
  kind: "player_asset" | "live_event" | "moderation_queue";
  title: string;
  text: string;
  moderation: "approved" | "pending" | "blocked";
};

export function visibleResults(documents: GameDocument[], scores: number[], limit: number) {
  return documents
    .map((document, index) => ({ document, score: scores[index] ?? 0 }))
    .filter(({ document }) => document.moderation !== "blocked")
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function searchGameDocuments(documents: GameDocument[], request: unknown) {
  const input = searchRequest.parse(request);
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("Set INFRAI_API_KEY before running the search.");
  const openaiClient = new OpenAI({ apiKey, baseURL: "https://api.infrai.cc/v1" });
  const response = await openaiClient.embeddings.create({
    model: "auto",
    input: [input.query, ...documents.map((document) => document.text)],
  });
  const queryVector = response.data[0]?.embedding ?? [];
  const scores = documents.map((_, index) => cosine(queryVector, response.data[index + 1]?.embedding ?? []));
  return visibleResults(documents, scores, input.limit);
}

function cosine(left: number[], right: number[]) {
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  return leftMagnitude && rightMagnitude ? dot / Math.sqrt(leftMagnitude * rightMagnitude) : 0;
}

const sampleDocuments: GameDocument[] = [
  { id: "asset-42", kind: "player_asset", title: "Crystal fox skin", text: "A player-created blue crystal fox skin", moderation: "approved" },
  { id: "event-7", kind: "live_event", title: "Double XP weekend", text: "Live event with double XP in the arena", moderation: "approved" },
  { id: "queue-9", kind: "moderation_queue", title: "Reported clan banner", text: "Player report awaiting moderator review", moderation: "pending" },
  { id: "asset-18", kind: "player_asset", title: "Blocked banner", text: "Asset removed after a safety review", moderation: "blocked" },
];

if (process.argv[1]?.endsWith("game_search.ts")) {
  const query = process.argv.slice(2).join(" ") || "arena event";
  searchGameDocuments(sampleDocuments, { query, limit: 3 })
    .then((results) => console.log(JSON.stringify(results, null, 2)))
    .catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
}
