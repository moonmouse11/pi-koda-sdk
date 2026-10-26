import { maskSecret } from "../secrets.js";
import { probeModelsEndpoint } from "./discover.js";
import { endpointPiProviderId, resolveEndpointApiKey, type SdkEndpoint } from "./endpoints.js";

export interface EndpointDoctorLine {
	summary: string;
	verbose: string[];
}

export async function describeEndpointHealth(
	endpoint: SdkEndpoint,
	options: { verbose: boolean; signal?: AbortSignal },
): Promise<EndpointDoctorLine> {
	const provider = endpointPiProviderId(endpoint);
	const key = resolveEndpointApiKey(endpoint);
	const keyLabel = key ? maskSecret(key) : "(none)";
	const summary = `  • ${provider} ← ${endpoint.baseUrl} (${endpoint.source}) key ${keyLabel}`;

	if (!options.verbose) {
		return { summary, verbose: [] };
	}

	const probe = await probeModelsEndpoint(endpoint.baseUrl, key, options.signal);
	const verbose = [
		`    GET ${probe.url}`,
		probe.ok
			? `    → ${probe.status} in ${probe.latencyMs}ms, models: ${probe.modelCount ?? 0}`
			: `    → failed (${probe.status || "network"}) in ${probe.latencyMs}ms: ${probe.error ?? "unknown"}`,
	];
	return { summary, verbose };
}

export async function buildDoctorReport(
	endpoints: SdkEndpoint[],
	options: { verbose: boolean; signal?: AbortSignal },
): Promise<string[]> {
	const health = await Promise.all(endpoints.map((endpoint) => describeEndpointHealth(endpoint, options)));
	return health.flatMap(({ summary, verbose }) => [summary, ...verbose]);
}
