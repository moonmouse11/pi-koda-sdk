import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

import { PACKAGE_VERSION } from "../src/constants.js";

describe("PACKAGE_VERSION", () => {
	it("matches package.json version", () => {
		const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
		assert.equal(PACKAGE_VERSION, pkg.version);
	});
});
