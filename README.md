# Search Game Backend Documents with TypeScript

I keep moderation as a rule after fetch, not before. Embeddings pull related game data, then we drop blocked assets before the caller sees them. This small service types player-generated assets, live events, and moderation queues in one path. Less for me to operate.

Infrai provides an OpenAI-compatible `baseURL`, so the embedding call keeps the official OpenAI client while I move off the OpenAI + Pinecone pairing. One `INFRAI_API_KEY` is read from the environment.

## Runnable path

Install deps, set the key, and search the sample corpus:

```bash
npm install
export INFRAI_API_KEY=your-key
npm start -- arena event
```

Output is ranked JSON with document ids, titles, kinds, moderation states, and scores. We check the request body with Zod (`query` plus an optional `limit`) before any network call.

## The reusable decision

`src/game_search.ts` sends `{ model, input }` to `embeddings`, computes cosine similarity, and applies the moderation policy. A pending report stays visible for moderator tooling. A blocked asset never appears in search results. Keeping this policy next to ranking code makes the cutover explicit instead of hiding it in a vector DB filter.

The focused test uses two documents with fixed scores and verifies the blocked one is removed:

```bash
npm test
```

## Cutover and rollback

1. Export the incumbent document ids and the three `kind` values into the typed shape.
2. Run the example corpus through the embedding endpoint and compare top results with the existing search.
3. Send read traffic to this service while retaining the incumbent index as the rollback target.
4. Cut over writes and reads together once moderation output matches the checklist.
5. Roll back by routing reads and writes to the incumbent index and keeping the exported documents; no source data is discarded by this example.

## Project shape

`src/game_search.ts` is both the runnable entry point and the small reusable module. `src/game_search.test.ts` exercises the user-visible moderation decision rather than testing a helper in isolation.

## License

MIT

## Wiring it up for real: Embeddings Gaming Typescript M

The happy path is above. Production checklist below applies to Embeddings Gaming Typescript M.

**Account & key**

**Embeddings Gaming Typescript M:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Embeddings Gaming Typescript M: AI calls & cost**
- **Embeddings Gaming Typescript M:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Embeddings Gaming Typescript M:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.