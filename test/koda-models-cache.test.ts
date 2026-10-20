import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadCachedModelsForProvider, resetModelsCacheMemo } from "../src/koda-models-cache.js";
import { writeModelsCache, withTempHome } from "./helpers/temp-home.js";

describe("loadCachedModelsForProvider", () => {
	it("reads models from Koda cache envelope", () => {
		withTempHome(({ root }) => {
			writeModelsCache(root, {
				version: 2,
				providers: {
					openrouter: {
						id: "openrouter",
						name: "OpenRouter",
						models: {
							"meta-llama/llama-3.3-70b-instruct": {
								ID: "meta-llama/llama-3.3-70b-instruct",
								Name: "Llama 3.3 70B",
								ContextSize: 131072,
								MaxOutputTokens: 8192,
								Reasoning: false,
								Vision: false,
							},
						},
					},
				},
			});
			resetModelsCacheMemo();
			const models = loadCachedModelsForProvider("openrouter");
			assert.equal(models.length, 1);
			assert.equal(models[0]?.id, "meta-llama/llama-3.3-70b-instruct");
			assert.equal(models[0]?.name, "Llama 3.3 70B");
			assert.equal(models[0]?.contextWindow, 131_072);
			assert.equal(models[0]?.maxTokens, 8192);
		});
	});
});
