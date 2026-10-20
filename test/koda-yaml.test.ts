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
});
