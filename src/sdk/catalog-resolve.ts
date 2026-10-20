import { loadCachedModelsForProvider } from "../koda-models-cache.js";
import { readModelOverrideIndex } from "../koda-model-meta.js";
import { discoverOpenAiModels, type DiscoveredModel } from "./discover.js";
import { modelsForEndpoint, resolveEndpointApiKey, type SdkEndpoint } from "./endpoints.js";

export async function resolveEndpointModels(
	endpoint: SdkEndpoint,
	signal?: AbortSignal,
): Promise<ReturnType<typeof modelsForEndpoint>> {
	const overrides = readModelOverrideIndex();
	let discovered = await fetchLiveModels(endpoint, signal);
	if (!discovered.length) {
		discovered = loadCachedModelsForProvider(endpoint.providerId);
	}
	return modelsForEndpoint(endpoint, discovered, overrides);
}

async function fetchLiveModels(endpoint: SdkEndpoint, signal?: AbortSignal): Promise<DiscoveredModel[]> {
	const key = resolveEndpointApiKey(endpoint);
	if (!key) return [];
	try {
		return await discoverOpenAiModels(endpoint.baseUrl, key, signal);
	} catch {
		return [];
	}
}
