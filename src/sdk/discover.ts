export interface DiscoveredModel {
	id: string;
	name: string;
}

export interface ModelsProbeResult {
	ok: boolean;
	status: number;
	latencyMs: number;
	modelCount?: number;
	error?: string;
	url: string;
}

export function modelsListUrl(baseUrl: string): string {
	const root = baseUrl.replace(/\/$/, "");
	return `${root}/models`;
}

export async function discoverOpenAiModels(
	baseUrl: string,
	apiKey: string,
	signal?: AbortSignal,
): Promise<DiscoveredModel[]> {
	const url = modelsListUrl(baseUrl);
	const response = await fetch(url, {
		signal,
		headers: authHeaders(apiKey),
	});
	if (!response.ok) {
		throw new Error(`Koda model discovery failed (${response.status}) at ${url}`);
	}
	const body = (await response.json()) as { data?: Array<{ id?: string }> };
	if (!Array.isArray(body.data)) return [];
	return body.data.flatMap((item) => {
		if (!item?.id) return [];
		return [{ id: item.id, name: item.id }];
	});
}

export async function probeModelsEndpoint(
	baseUrl: string,
	apiKey: string | undefined,
	signal?: AbortSignal,
): Promise<ModelsProbeResult> {
	const url = modelsListUrl(baseUrl);
	const started = performance.now();
	if (!apiKey?.trim()) {
		return {
			ok: false,
			status: 0,
			latencyMs: 0,
			error: "no API key (set KODA_API_KEY or auth.yaml)",
			url,
		};
	}
	try {
		const response = await fetch(url, {
			signal,
			headers: authHeaders(apiKey),
		});
		const latencyMs = Math.round(performance.now() - started);
		if (!response.ok) {
			return {
				ok: false,
				status: response.status,
				latencyMs,
				error: response.statusText || `HTTP ${response.status}`,
				url,
			};
		}
		const body = (await response.json()) as { data?: unknown[] };
		const modelCount = Array.isArray(body.data) ? body.data.length : 0;
		return { ok: true, status: response.status, latencyMs, modelCount, url };
	} catch (err) {
		const latencyMs = Math.round(performance.now() - started);
		const message = err instanceof Error ? err.message : String(err);
		return {
			ok: false,
			status: 0,
			latencyMs,
			error: message,
			url,
		};
	}
}

function authHeaders(apiKey: string): Record<string, string> {
	return {
		Authorization: `Bearer ${apiKey}`,
		"Content-Type": "application/json",
	};
}
