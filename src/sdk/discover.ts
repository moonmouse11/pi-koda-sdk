export interface DiscoveredModel {
	id: string;
	name: string;
}

export async function discoverOpenAiModels(
	baseUrl: string,
	apiKey: string,
	signal?: AbortSignal,
): Promise<DiscoveredModel[]> {
	const root = baseUrl.replace(/\/$/, "");
	const url = `${root}/models`;
	const response = await fetch(url, {
		signal,
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
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
