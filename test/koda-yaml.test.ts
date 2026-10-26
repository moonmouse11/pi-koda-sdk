import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { readKodaOpenAiEndpoints } from "../src/koda-yaml.js";
import { writeKodaAuth, writeKodaConfig, withTempHome } from "./helpers/temp-home.js";

describe("readKodaOpenAiEndpoints", () => {
	it("reads compatible providers, auth keys, and model refs", () => {
		withTempHome(({ root }) => {
			writeKodaConfig(
				root,
				`
version: 1
providers:
  - id: openrouter
    base_url: https://openrouter.ai/api/v1
model:
  primary: openrouter/openai/gpt-5
`,
			);
			writeKodaAuth(
				root,
				`
openrouter:
  type: api
  access: sk-or-test-key
`,
			);
			const endpoints = readKodaOpenAiEndpoints();
			assert.equal(endpoints.length, 1);
			assert.equal(endpoints[0]?.providerId, "openrouter");
			assert.equal(endpoints[0]?.baseUrl, "https://openrouter.ai/api/v1");
			assert.equal(endpoints[0]?.apiKey, "sk-or-test-key");
			assert.deepEqual(endpoints[0]?.modelIds, ["openai/gpt-5"]);
		});
	});

	it("keeps models rows of other providers out of an endpoint", () => {
		withTempHome(({ root }) => {
			writeKodaConfig(
				root,
				`
version: 1
providers:
  - id: a
    base_url: https://a.example/v1
  - id: b
    base_url: https://b.example/v1
models:
  - name: m-a
    provider: a
    model: model-a
  - name: m-b
    provider: b
    model: model-b
  - name: shared
    model: model-any
`,
			);
			const [a, b] = readKodaOpenAiEndpoints();
			assert.deepEqual(a?.modelIds, ["model-a", "model-any"]);
			assert.deepEqual(b?.modelIds, ["model-b", "model-any"]);
		});
	});
});
