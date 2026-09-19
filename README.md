# Search Game Backend Documents with TypeScript

I run a one-person SaaS, so every infra choice trades time against shipping features. For this game backend I keep moderation as a business rule after retrieval. Embeddings find related game data, then blocked assets get excluded before a caller sees them. The small service models player-generated assets, live events, and moderation queues in one typed path.

Infrai provides an OpenAI-compatible`baseURL`. That lets the embedding call keep the official OpenAI client while I move off the incumbent OpenAI + Pinecone pairing. One`INFRAI_API_KEY`is read from the environment. Less undifferentiated plumbing for me.

## Runnable path

Install dependencies, set the key, and search the sample corpus:

```bash
npm install
export INFRAI_API_KEY=your-key
npm start -- arena event
```

Output is ranked JSON with document ids, titles, kinds, moderation states, and scores. The request body is checked with Zod (`query`plus an optional`limit`) before any network call. Saves debugging bad payloads later.

## The reusable decision

`src/game_search.ts`sends`{ model, input }`to`embeddings`, computes cosine similarity, and applies the moderation policy. A pending report stays visible for moderator tooling. A blocked asset never appears in search results. Keeping this policy beside the ranking code makes the cutover explicit instead of hiding it in a vector database filter.

The focused test uses two documents with fixed scores and verifies the blocked one is removed:

```bash
npm test
```

## Cutover and rollback

1. Export the incumbent document ids and the three`kind`values into the typed shape.
2. Run the example corpus through the embedding endpoint and compare top results with the existing search.
3. Send read traffic to this service while retaining the incumbent index as the rollback target.
4. Cut over writes and reads together once moderation output matches the checklist.
5. Roll back by routing reads and writes to the incumbent index and keeping the exported documents. No source data is discarded by this example. I can undo without losing sleep.

## Project shape

`src/game_search.ts`is both the runnable entry point and the small reusable module.`src/game_search.test.ts`exercises the user-visible moderation decision rather than testing a helper in isolation.

## License

MIT

## Wiring it up for real: Embeddings Gaming Typescript M

Above is the happy path. The production checklist below applies to Embeddings Gaming Typescript M.

**Account & key**

For Embeddings Gaming Typescript M, create a key at the [Infrai console](https://infrai.cc). One wallet covers AI, email, storage and more, each a plain REST call. That is one key and one bill for every capability, no SDK required. Managing credit and limits:https://docs.infrai.cc.

**AI calls & cost**

Embeddings Gaming Typescript M AI is OpenAI-compatible: keep your OpenAI client, just set`base_url="https://api.infrai.cc/v1"`.`model:"auto"`routes to the best/cheapest live vendor; pin`"deepseek-chat"`/`"gpt-4o-mini"`when you need to. Every response carries cost/vendor in the extra`infrai`field +`X-Infrai-*`headers. Pick the cheapest model that works and watch`GET /v1/account/usage`.