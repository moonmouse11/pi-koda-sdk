import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { maskSecret } from "../src/secrets.js";

describe("maskSecret", () => {
	it("masks long secrets", () => {
		assert.equal(maskSecret("sk-or-abcdefghijklmnopqrstuvwxyz"), "sk-o…wxyz");
	});
	it("handles short values", () => {
		assert.equal(maskSecret("short"), "****");
	});
});
