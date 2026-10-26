import { readKodaConfigDocument } from "./koda-config-doc.js";
import { endpointPiProviderId } from "./sdk/endpoints.js";

function readRoute(path: string[]): string | undefined {
	const doc = readKodaConfigDocument();
	if (!doc) return undefined;
	let node: unknown = doc;
	for (const key of path) {
		if (!node || typeof node !== "object") return undefined;
		node = (node as Record<string, unknown>)[key];
	}
	return typeof node === "string" && node.trim() ? node.trim() : undefined;
}

/** Koda `provider/model` route from config.yaml `model.primary`. */
export function readKodaPrimaryModelRoute(): string | undefined {
	return readRoute(["model", "primary"]);
}

export function readKodaUtilityModelRoute(): string | undefined {
	return readRoute(["utility_model"]);
}

export function readKodaReviewModelRoute(): string | undefined {
	return readRoute(["workflow", "review_model", "primary"]);
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

export function formatRoutingHints(): string[] {
	const lines: string[] = [];
	const primary = readKodaPrimaryModelRoute();
	if (primary) {
		lines.push(`Suggested default (model.primary): pi --model ${kodaRouteToPiModelRef(primary)}`);
	}
	const utility = readKodaUtilityModelRoute();
	if (utility) {
		lines.push(`Utility route (utility_model): pi --model ${kodaRouteToPiModelRef(utility)}`);
	}
	const review = readKodaReviewModelRoute();
	if (review) {
		lines.push(`Review route (workflow.review_model.primary): pi --model ${kodaRouteToPiModelRef(review)}`);
	}
	return lines;
}
