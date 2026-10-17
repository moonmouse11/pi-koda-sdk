import { loadSdkConfig } from "../config.js";
import { readKodaOpenAiEndpoints } from "../koda-yaml.js";
import type { DiscoveredModel } from "./discover.js";

export interface SdkEndpoint {
	providerId: string;
	baseUrl: string;
	apiKey?: string;
	modelIds: string[];
	source: "env" | "pi-config" | "koda-yaml";
}

export function collectSdkEndpoints(): SdkEndpoint[] {
	const out: SdkEndpoint[] = [];
	const envBase = process.env.KODA_BASE_URL?.trim();
	const envKey = process.env.KODA_API_KEY?.trim();
	if (envBase) {
		out.push({
			providerId: "koda",
			baseUrl: envBase.replace(/\/$/, ""),
			apiKey: envKey,
			modelIds: [],
			source: "env",
		});
	}

	const piConfig = loadSdkConfig();
	if (piConfig.baseUrl) {
		out.push({
			providerId: "koda",
			baseUrl: piConfig.baseUrl.replace(/\/$/, ""),
			apiKey: envKey,
			modelIds: [],
			source: "pi-config",
		});
	}

	for (const row of readKodaOpenAiEndpoints()) {
		out.push({
			providerId: row.providerId === "koda" ? "koda" : row.providerId,
			baseUrl: row.baseUrl,
			apiKey: row.apiKey ?? envKey,
			modelIds: row.modelIds,
			source: "koda-yaml",
		});
	}

	return dedupeEndpoints(out);
}

function dedupeEndpoints(endpoints: SdkEndpoint[]): SdkEndpoint[] {
	const seen = new Set<string>();
	return endpoints.filter((item) => {
		const key = `${item.providerId}\0${item.baseUrl}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

export function endpointPiProviderId(endpoint: SdkEndpoint): string {
	return endpoint.providerId === "koda" ? "koda" : `koda-${endpoint.providerId}`;
}

export function modelsForEndpoint(endpoint: SdkEndpoint, discovered: DiscoveredModel[] = []) {
	const ZERO_COST = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
	const ids = discovered.length ? discovered : endpoint.modelIds.map((id) => ({ id, name: id }));
	const list = ids.length ? ids : [{ id: "default", name: "Default" }];
	return list.map((item) => ({
		id: item.id,
		name: item.name,
		reasoning: false,
		input: ["text" as const],
		cost: ZERO_COST,
		contextWindow: 128_000,
		maxTokens: 16_000,
	}));
}
