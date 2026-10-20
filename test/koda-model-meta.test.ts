import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { lookupModelOverride, readModelOverrideIndex } from "../src/koda-model-meta.js";
import { writeKodaConfig, withTempHome } from "./helpers/temp-home.js";

describe("readModelOverrideIndex", () => {
	it("parses model_overrides from config.yaml", () => {
		withTempHome(({ root }) => {
			writeKodaConfig(
				root,
				`
model_overrides:
  - ref: openrouter/openai/gpt-5
    name: GPT 5
    context_size: 200000
    max_output_tokens: 32000
    reasoning: true
    vision: true
`,
			);
			const index = readModelOverrideIndex();
			assert.equal(index.size, 1);
			const hit = lookupModelOverride(index, "openrouter", "openai/gpt-5");
			assert.ok(hit);
			assert.equal(hit?.name, "GPT 5");
			assert.equal(hit?.contextWindow, 200_000);
			assert.equal(hit?.maxTokens, 32_000);
			assert.equal(hit?.reasoning, true);
			assert.equal(hit?.vision, true);
		});
	});
});

describe("lookupModelOverride", () => {
	it("matches provider/model ref case-insensitively", () => {
		const index = new Map([
			[
				"qwencloud/qwen3.6-plus",
				{ ref: "qwencloud/qwen3.6-plus", maxTokens: 64_000 },
			],
		]);
		const hit = lookupModelOverride(index, "QwenCloud", "qwen3.6-plus");
		assert.equal(hit?.maxTokens, 64_000);
	});
});
