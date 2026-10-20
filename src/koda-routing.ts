import fs from "node:fs";
import { parse as parseYaml } from "yaml";

import { findKodaConfigPath } from "./koda-paths.js";
import { endpointPiProviderId } from "./sdk/endpoints.js";

/** Koda `provider/model` route from config.yaml `model.primary`. */
export function readKodaPrimaryModelRoute(): string | undefined {
	const configPath = findKodaConfigPath();
	if (!configPath) return undefined;
	let doc: unknown;
	try {
		doc = parseYaml(fs.readFileSync(configPath, "utf8"));
	} catch {
		return undefined;
	}
	if (!doc || typeof doc !== "object") return undefined;
	const model = (doc as Record<string, unknown>).model;
	if (!model || typeof model !== "object") return undefined;
	const primary = (model as Record<string, unknown>).primary;
	return typeof primary === "string" && primary.trim() ? primary.trim() : undefined;
}

/** Pi model ref: `koda/<id>` or `koda-<provider>/<id>`. */
export function kodaRouteToPiModelRef(route: string): string {
	const slash = route.indexOf("/");
	if (slash < 0) {
		return `koda/${route}`;
	}
	const providerId = route.slice(0, slash);
	const modelId = route.slice(slash + 1);
	if (!modelId) return `koda/${route}`;
	const piProvider = endpointPiProviderId({ providerId, baseUrl: "", modelIds: [], source: "koda-yaml" });
	return `${piProvider}/${modelId}`;
}

export function formatPrimaryModelHint(): string | undefined {
	const route = readKodaPrimaryModelRoute();
	if (!route) return undefined;
	const piRef = kodaRouteToPiModelRef(route);
	return `Suggested default (from model.primary): pi --model ${piRef}`;
}
