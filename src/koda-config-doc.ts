import fs from "node:fs";
import { parse as parseYaml } from "yaml";

import { findKodaConfigPath } from "./koda-paths.js";

export function readKodaConfigDocument(): Record<string, unknown> | undefined {
	const configPath = findKodaConfigPath();
	if (!configPath) return undefined;
	try {
		const doc = parseYaml(fs.readFileSync(configPath, "utf8"));
		if (!doc || typeof doc !== "object") return undefined;
		return doc as Record<string, unknown>;
	} catch {
		return undefined;
	}
}
