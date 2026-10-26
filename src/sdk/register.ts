import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { STARTUP_DISCOVERY_TIMEOUT_MS } from "../constants.js";
import { resetModelsCacheMemo } from "../koda-models-cache.js";
import { resolveEndpointModels } from "./catalog-resolve.js";
import {
	collectSdkEndpoints,
	endpointPiProviderId,
	modelsForEndpoint,
	type SdkEndpoint,
} from "./endpoints.js";

export interface KodaSdkRegistry {
	endpoints: SdkEndpoint[];
	refreshDiscovery: (signal?: AbortSignal) => Promise<number>;
	reload: (signal?: AbortSignal) => Promise<number>;
	scheduleStartupDiscovery: () => void;
}

export function registerKodaSdkProviders(pi: ExtensionAPI): KodaSdkRegistry {
	const discovered = new Map<string, ReturnType<typeof modelsForEndpoint>>();
	const registeredProviderIds = new Set<string>();
	let endpoints = collectSdkEndpoints();

	function unregisterAll(): void {
		for (const id of registeredProviderIds) {
			try {
				pi.unregisterProvider(id);
			} catch {
				/* provider may already be gone after extension reload */
			}
		}
		registeredProviderIds.clear();
	}

	function registerOne(endpoint: SdkEndpoint, models: ReturnType<typeof modelsForEndpoint>): void {
		const providerId = endpointPiProviderId(endpoint);
		const apiKey = endpoint.apiKey ? endpoint.apiKey : "$KODA_API_KEY";
		pi.registerProvider(providerId, {
			baseUrl: `${endpoint.baseUrl}/`,
			api: "openai-completions",
			apiKey,
			models,
		});
		registeredProviderIds.add(providerId);
	}

	function registerStaticCatalog(): void {
		for (const endpoint of endpoints) {
			registerOne(endpoint, discovered.get(cacheKey(endpoint)) ?? modelsForEndpoint(endpoint));
		}
	}

	function reloadEndpointsFromDisk(): void {
		resetModelsCacheMemo();
		unregisterAll();
		endpoints = collectSdkEndpoints();
		registerStaticCatalog();
	}

	registerStaticCatalog();

	async function refreshDiscovery(signal?: AbortSignal): Promise<number> {
		const current = endpoints;
		const resolved = await Promise.all(
			current.map((endpoint) => resolveEndpointModels(endpoint, signal).catch(() => [])),
		);
		let total = 0;
		current.forEach((endpoint, index) => {
			const configs = resolved[index] ?? [];
			if (!configs.length || (configs.length === 1 && configs[0]?.id === "default" && !endpoint.modelIds.length)) {
				return; /* keep static catalog */
			}
			discovered.set(cacheKey(endpoint), configs);
			const providerId = endpointPiProviderId(endpoint);
			try {
				pi.unregisterProvider(providerId);
				registeredProviderIds.delete(providerId);
			} catch {
				/* first registration */
			}
			registerOne(endpoint, configs);
			total += configs.length;
		});
		return total;
	}

	return {
		get endpoints() {
			return endpoints;
		},
		refreshDiscovery,
		async reload(signal) {
			reloadEndpointsFromDisk();
			return refreshDiscovery(signal);
		},
		scheduleStartupDiscovery() {
			const signal = AbortSignal.timeout(STARTUP_DISCOVERY_TIMEOUT_MS);
			void refreshDiscovery(signal).catch(() => {
				/* fail open — yaml/env catalog remains */
			});
		},
	};
}

function cacheKey(endpoint: SdkEndpoint): string {
	return `${endpointPiProviderId(endpoint)}\0${endpoint.baseUrl}`;
}
