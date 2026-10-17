import fs from "node:fs";
import { parse as parseYaml } from "yaml";

import { findKodaAuthPath, findKodaConfigPath } from "./koda-paths.js";

export interface KodaOpenAiEndpoint {
	providerId: string;
	baseUrl: string;
	apiKey?: string;
	modelIds: string[];
}

export function readKodaOpenAiEndpoints(): KodaOpenAiEndpoint[] {
	const configPath = findKodaConfigPath();
	if (!configPath) return [];
	let doc: unknown;
	try {
		doc = parseYaml(fs.readFileSync(configPath, "utf8"));
	} catch {
		return [];
	}
	if (!doc || typeof doc !== "object") return [];
	const record = doc as Record<string, unknown>;
	const providers = Array.isArray(record.providers) ? record.providers : [];
	const auth = readAuthMap();
	const endpoints: KodaOpenAiEndpoint[] = [];

	for (const item of providers) {
		if (!item || typeof item !== "object") continue;
		const provider = item as Record<string, unknown>;
		const id = typeof provider.id === "string" ? provider.id : undefined;
		const baseUrl = typeof provider.base_url === "string" ? provider.base_url : typeof provider.baseUrl === "string" ? provider.baseUrl : undefined;
		if (!id || !baseUrl) continue;
		const key = auth.get(id) ?? auth.get("koda") ?? auth.get("koda-chat-models");
		endpoints.push({
			providerId: id,
			baseUrl: baseUrl.replace(/\/$/, ""),
			apiKey: key,
			modelIds: collectModelRefs(record, id),
		});
	}
	return endpoints;
}

function readAuthMap(): Map<string, string> {
	const authPath = findKodaAuthPath();
	const map = new Map<string, string>();
	if (!authPath) return map;
	let doc: unknown;
	try {
		doc = parseYaml(fs.readFileSync(authPath, "utf8"));
	} catch {
		return map;
	}
	if (!doc || typeof doc !== "object") return map;
	for (const [providerId, value] of Object.entries(doc as Record<string, unknown>)) {
		if (!value || typeof value !== "object") continue;
		const entry = value as Record<string, unknown>;
		const access = typeof entry.access === "string" ? entry.access.trim() : typeof entry.key === "string" ? entry.key.trim() : "";
		if (access) map.set(providerId, access);
	}
	return map;
}

function collectModelRefs(config: Record<string, unknown>, providerId: string): string[] {
	const ids = new Set<string>();
	const primary = config.model;
	if (primary && typeof primary === "object") {
		for (const value of Object.values(primary as Record<string, unknown>)) {
			addRef(ids, value, providerId);
		}
	}
	const models = config.models;
	if (Array.isArray(models)) {
		for (const item of models) {
			if (!item || typeof item !== "object") continue;
			const row = item as Record<string, unknown>;
			if (typeof row.model === "string") ids.add(row.model);
			if (typeof row.name === "string" && row.provider === providerId && typeof row.model === "string") {
				ids.add(row.model);
			}
		}
	}
	return [...ids];
}

function addRef(ids: Set<string>, value: unknown, providerId: string): void {
	if (typeof value !== "string") return;
	const slash = value.indexOf("/");
	if (slash < 0) {
		ids.add(value);
		return;
	}
	const refProvider = value.slice(0, slash);
	const modelId = value.slice(slash + 1);
	if (refProvider === providerId && modelId) ids.add(modelId);
}
