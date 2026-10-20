import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatRoutingHints, kodaRouteToPiModelRef } from "../src/koda-routing.js";
import { writeKodaConfig, withTempHome } from "./helpers/temp-home.js";

describe("kodaRouteToPiModelRef", () => {
	it("builds pi provider/model refs", () => {
		assert.equal(kodaRouteToPiModelRef("openrouter/openai/gpt-5"), "koda-openrouter/openai/gpt-5");
		assert.equal(kodaRouteToPiModelRef("koda/default"), "koda/default");
	});
});

describe("formatRoutingHints", () => {
	it("includes primary, utility, and review routes", () => {
		withTempHome(({ root }) => {
			writeKodaConfig(
				root,
				`
model:
  primary: openrouter/openai/gpt-5
utility_model: openrouter/openai/gpt-5-mini
workflow:
  review_model:
    primary: openrouter/openai/gpt-5-mini
`,
			);
			const hints = formatRoutingHints();
			assert.equal(hints.length, 3);
			assert.match(hints[0] ?? "", /model\.primary.*koda-openrouter\/openai\/gpt-5/);
			assert.match(hints[1] ?? "", /utility_model.*gpt-5-mini/);
			assert.match(hints[2] ?? "", /review_model.*gpt-5-mini/);
		});
	});
});
