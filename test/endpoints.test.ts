import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import type { KodaModelOverride } from "../src/koda-model-meta.js";
import {
	collectSdkEndpointSources,
	endpointPiProviderId,
	modelsForEndpoint,
	type SdkEndpoint,
} from "../src/sdk/endpoints.js";
import { withTempHome } from "./helpers/temp-home.js";

describe("endpointPiProviderId", () => {
	it("maps koda and custom provider ids", () => {
		const base: SdkEndpoint = { providerId: "koda", baseUrl: "https://x/v1", modelIds: [], source: "env" };
		assert.equal(endpointPiProviderId(base), "koda");
		assert.equal(endpointPiProviderId({ ...base, providerId: "openrouter" }), "koda-openrouter");
	});
});

describe("modelsForEndpoint", () => {
	it("applies override map to model metadata", () => {
		const endpoint: SdkEndpoint = {
			providerId: "openrouter",
			baseUrl: "https://openrouter.ai/api/v1",
			modelIds: ["openai/gpt-5"],
			source: "koda-yaml",
		};
		const overrides = new Map<string, KodaModelOverride>([
			[
				"openrouter/openai/gpt-5",
				{
					ref: "openrouter/openai/gpt-5",
					name: "GPT 5",
					contextWindow: 1_000_000,
					maxTokens: 64_000,
					reasoning: true,
					vision: true,
				},
			],
		]);
		const models = modelsForEndpoint(endpoint, [], overrides);
		assert.equal(models.length, 1);
		assert.equal(models[0]?.name, "GPT 5");
		assert.equal(models[0]?.contextWindow, 1_000_000);
		assert.equal(models[0]?.maxTokens, 64_000);
		assert.equal(models[0]?.reasoning, true);
		assert.deepEqual(models[0]?.input, ["text", "image"]);
	});
});

describe("collectSdkEndpointSources", () => {
	it("dedupes env and pi-config when base URL matches", () => {
		withTempHome(({ root }) => {
			const prevBase = process.env.KODA_BASE_URL;
			process.env.KODA_BASE_URL = "https://api.example.com/v1";
			const agentDir = path.join(root, ".pi", "agent");
			fs.mkdirSync(agentDir, { recursive: true });
			fs.writeFileSync(
				path.join(agentDir, "koda-sdk.json"),
				JSON.stringify({ baseUrl: "https://api.example.com/v1" }),
				"utf8",
			);
			try {
				const { endpoints, lines } = collectSdkEndpointSources();
				assert.equal(endpoints.length, 1);
				assert.equal(endpoints[0]?.source, "env");
				assert.ok(lines.some((line) => line.includes("[dedupe]")));
			} finally {
				if (prevBase === undefined) delete process.env.KODA_BASE_URL;
				else process.env.KODA_BASE_URL = prevBase;
			}
		});
	});
});
