import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { discoverOpenAiModels } from "./discover.js";
import { collectSdkEndpoints, endpointPiProviderId, modelsForEndpoint, type SdkEndpoint } from "./endpoints.js";

export interface KodaSdkRegistry {
	endpoints: SdkEndpoint[];
	refreshDiscovery: (signal?: AbortSignal) => Promise<number>;
}

export function registerKodaSdkProviders(pi: ExtensionAPI): KodaSdkRegistry {
	const endpoints = collectSdkEndpoints();
	const discovered = new Map<string, ReturnType<typeof modelsForEndpoint>>();

	for (const endpoint of endpoints) {
		registerOne(pi, endpoint, discovered.get(cacheKey(endpoint)) ?? modelsForEndpoint(endpoint));
	}

	return {
		endpoints,
		async refreshDiscovery(signal) {
			let total = 0;
			for (const endpoint of endpoints) {
				const key = resolveApiKey(endpoint);
				if (!key) continue;
				try {
					const models = await discoverOpenAiModels(endpoint.baseUrl, key, signal);
					const configs = modelsForEndpoint(endpoint, models);
					discovered.set(cacheKey(endpoint), configs);
					registerOne(pi, endpoint, configs);
					total += configs.length;
				} catch {
					/* keep static catalog */
				}
			}
			return total;
		},
	};
}

function registerOne(
	pi: ExtensionAPI,
	endpoint: SdkEndpoint,
	models: ReturnType<typeof modelsForEndpoint>,
): void {
	const providerId = endpointPiProviderId(endpoint);
	const apiKey = endpoint.apiKey ? endpoint.apiKey : "$KODA_API_KEY";
	pi.registerProvider(providerId, {
		baseUrl: `${endpoint.baseUrl}/`,
		api: "openai-completions",
		apiKey,
		models,
	});
}

function cacheKey(endpoint: SdkEndpoint): string {
	return `${endpointPiProviderId(endpoint)}\0${endpoint.baseUrl}`;
}

function resolveApiKey(endpoint: SdkEndpoint): string | undefined {
	if (endpoint.apiKey?.trim()) return endpoint.apiKey.trim();
	const env = process.env.KODA_API_KEY?.trim();
	return env || undefined;
}
