import { readKodaConfigDocument } from "./koda-config-doc.js";

export interface KodaModelOverride {
	ref: string;
	name?: string;
	contextWindow?: number;
	maxTokens?: number;
	reasoning?: boolean;
	vision?: boolean;
}

export function readModelOverrideIndex(): Map<string, KodaModelOverride> {
	const doc = readKodaConfigDocument();
	const index = new Map<string, KodaModelOverride>();
	if (!doc) return index;
	const rows = doc.model_overrides;
	if (!Array.isArray(rows)) return index;
	for (const row of rows) {
		if (!row || typeof row !== "object") continue;
		const parsed = parseOverrideRow(row as Record<string, unknown>);
		if (parsed) index.set(normalizeRefKey(parsed.ref), parsed);
	}
	return index;
}

export function lookupModelOverride(
	index: Map<string, KodaModelOverride>,
	providerId: string,
	modelId: string,
): KodaModelOverride | undefined {
	return (
		index.get(normalizeRefKey(`${providerId}/${modelId}`)) ??
		index.get(normalizeRefKey(modelId)) ??
		undefined
	);
}

function parseOverrideRow(row: Record<string, unknown>): KodaModelOverride | undefined {
	const ref = typeof row.ref === "string" ? row.ref.trim() : "";
	if (!ref) return undefined;
	const name = typeof row.name === "string" && row.name.trim() ? row.name.trim() : undefined;
	const contextWindow = pickInt(row, ["context_size", "contextSize", "max_input_tokens", "maxInputTokens"]);
	const maxTokens = pickInt(row, ["max_output_tokens", "maxOutputTokens", "default_output_tokens", "defaultOutputTokens"]);
	const reasoning = pickBool(row, ["reasoning"]);
	const vision = pickBool(row, ["vision"]);
	return { ref, name, contextWindow, maxTokens, reasoning, vision };
}

function normalizeRefKey(ref: string): string {
	return ref.trim().toLowerCase();
}

function pickInt(row: Record<string, unknown>, keys: string[]): number | undefined {
	for (const key of keys) {
		const value = row[key];
		if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.floor(value);
	}
	return undefined;
}

function pickBool(row: Record<string, unknown>, keys: string[]): boolean | undefined {
	for (const key of keys) {
		const value = row[key];
		if (typeof value === "boolean") return value;
	}
	return undefined;
}
