import { loadSdkConfig } from "../config.js";
import { lookupModelOverride, readModelOverrideIndex, type KodaModelOverride } from "../koda-model-meta.js";
import { isKodaProviderId, readKodaOpenAiEndpoints } from "../koda-yaml.js";
import type { DiscoveredModel } from "./discover.js";

export interface SdkEndpoint {
	providerId: string;
	baseUrl: string;
	apiKey?: string;
	modelIds: string[];
	source: "env" | "pi-config" | "koda-yaml";
}

export function collectSdkEndpoints(): SdkEndpoint[] {
	return collectSdkEndpointSources().endpoints;
}

export function endpointPiProviderId(endpoint: SdkEndpoint): string {
	return endpoint.providerId === "koda" ? "koda" : `koda-${endpoint.providerId}`;
}

export function modelsForEndpoint(
	endpoint: SdkEndpoint,
	discovered: DiscoveredModel[] = [],
	overrides: Map<string, KodaModelOverride> = readModelOverrideIndex(),
) {
	const ZERO_COST = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
	const ids: DiscoveredModel[] = discovered.length
		? discovered
		: endpoint.modelIds.map((id) => ({ id, name: id }));
	const list: DiscoveredModel[] = ids.length ? ids : [{ id: "default", name: "Default" }];
	return list.map((item) => {
		const o = lookupModelOverride(overrides, endpoint.providerId, item.id);
		const reasoning = o?.reasoning ?? item.reasoning ?? false;
		const vision = o?.vision ?? item.vision ?? false;
		const input = vision ? (["text", "image"] as const) : (["text"] as const);
		return {
			id: item.id,
			name: o?.name ?? item.name,
			reasoning,
			input: [...input],
			cost: ZERO_COST,
			contextWindow: o?.contextWindow ?? item.contextWindow ?? 128_000,
			maxTokens: o?.maxTokens ?? item.maxTokens ?? 16_000,
		};
	});
}

export interface SdkEndpointCandidate extends SdkEndpoint {
	_index: number;
}

export function collectSdkEndpointSources(): { endpoints: SdkEndpoint[]; lines: string[] } {
	const raw: SdkEndpointCandidate[] = [];
	const lines: string[] = [];
	let index = 0;

	const envBase = process.env.KODA_BASE_URL?.trim();
	const envKey = process.env.KODA_API_KEY?.trim();
	if (envBase) {
		raw.push({
			providerId: "koda",
			baseUrl: envBase.replace(/\/$/, ""),
			apiKey: envKey,
			modelIds: [],
			source: "env",
			_index: index++,
		});
		lines.push(`[env] KODA_BASE_URL → koda @ ${envBase.replace(/\/$/, "")}`);
	}

	const piConfig = loadSdkConfig();
	if (piConfig.baseUrl) {
		raw.push({
			providerId: "koda",
			baseUrl: piConfig.baseUrl.replace(/\/$/, ""),
			apiKey: envKey,
			modelIds: [],
			source: "pi-config",
			_index: index++,
		});
		lines.push(`[pi-config] koda-sdk.json → koda @ ${piConfig.baseUrl.replace(/\/$/, "")}`);
	}

	for (const row of readKodaOpenAiEndpoints()) {
		const { providerId } = row;
		raw.push({
			providerId,
			baseUrl: row.baseUrl,
			apiKey: row.apiKey ?? (isKodaProviderId(providerId) ? envKey : undefined),
			modelIds: row.modelIds,
			source: "koda-yaml",
			_index: index++,
		});
		lines.push(
			`[koda-yaml] ${endpointPiProviderId({ providerId, baseUrl: row.baseUrl, modelIds: row.modelIds, source: "koda-yaml" })} @ ${row.baseUrl}`,
		);
	}

	const { endpoints, dropped } = dedupeWithTrace(raw);
	lines.push(...dropped);

	return { endpoints, lines };
}

function dedupeWithTrace(raw: SdkEndpointCandidate[]): { endpoints: SdkEndpoint[]; dropped: string[] } {
	const seen = new Set<string>();
	const endpoints: SdkEndpoint[] = [];
	const dropped: string[] = [];
	for (const item of raw) {
		const key = `${item.providerId}\0${item.baseUrl}`;
		if (seen.has(key)) {
			dropped.push(
				`[dedupe] dropped duplicate: ${endpointPiProviderId(item)} @ ${item.baseUrl} (${item.source}, #${item._index})`,
			);
			continue;
		}
		seen.add(key);
		const { _index, ...endpoint } = item;
		endpoints.push(endpoint);
	}
	return { endpoints, dropped };
}

export function resolveEndpointApiKey(endpoint: SdkEndpoint): string | undefined {
	if (endpoint.apiKey?.trim()) return endpoint.apiKey.trim();
	if (!isKodaProviderId(endpoint.providerId)) return undefined;
	const env = process.env.KODA_API_KEY?.trim();
	return env || undefined;
}
