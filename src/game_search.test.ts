import { strict as assert } from "node:assert";
import { visibleResults, type GameDocument } from "./game_search.js";

const documents: GameDocument[] = [
  { id: "ok", kind: "player_asset", title: "Visible", text: "", moderation: "approved" },
  { id: "blocked", kind: "player_asset", title: "Hidden", text: "", moderation: "blocked" },
];
const result = visibleResults(documents, [0.2, 0.99], 5);
assert.deepEqual(result.map((item) => item.document.id), ["ok"]);
console.log("moderation filter keeps approved documents and excludes blocked assets");
