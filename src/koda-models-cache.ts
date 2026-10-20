import fs from "node:fs";

import type { DiscoveredModel } from "./sdk/discover.js";
import { findKodaModelsCachePath } from "./koda-paths.js";

interface CacheEnvelope {
	version?: number;
	providers?: Record<string, CacheProvider>;
}

interface CacheProvider {
	id?: string;
	name?: string;
	models?: Record<string, CacheModelRaw>;
}

type CacheModelRaw = Record<string, unknown>;

let cachedEnvelope: CacheEnvelope | null | undefined;

export function findModelsCacheFile(): string | undefined {
	return findKodaModelsCachePath();
}

export function loadCachedModelsForProvider(providerId: string): DiscoveredModel[] {
	const provider = loadCacheEnvelope()?.providers?.[providerId];
	if (!provider?.models) return [];
	return Object.entries(provider.models).flatMap(([key, raw]) => {
		const parsed = parseCacheModel(key, raw);
		return parsed ? [parsed] : [];
	});
}

function loadCacheEnvelope(): CacheEnvelope | null {
	if (cachedEnvelope !== undefined) return cachedEnvelope;
	const path = findKodaModelsCachePath();
	if (!path) {
		cachedEnvelope = null;
		return null;
	}
	try {
		const raw = JSON.parse(fs.readFileSync(path, "utf8")) as CacheEnvelope;
		cachedEnvelope = raw?.providers ? raw : null;
	} catch {
		cachedEnvelope = null;
	}
	return cachedEnvelope;
}

/** Clear in-memory cache (after /koda reload). */
export function resetModelsCacheMemo(): void {
	cachedEnvelope = undefined;
}

function parseCacheModel(fallbackId: string, raw: CacheModelRaw): DiscoveredModel | undefined {
	const id = pickString(raw, ["ID", "id"]) ?? fallbackId;
	if (!id) return undefined;
	const name = pickString(raw, ["Name", "name"]) ?? id;
	const contextWindow = pickInt(raw, ["ContextSize", "context_size", "contextSize", "MaxInputTokens", "max_input_tokens"]);
	const maxTokens = pickInt(raw, ["MaxOutputTokens", "max_output_tokens", "maxOutputTokens", "DefaultOutputTokens", "default_output_tokens"]);
	const reasoning = pickBool(raw, ["Reasoning", "reasoning"]);
	const vision = pickBool(raw, ["Vision", "vision"]);
	return { id, name, contextWindow, maxTokens, reasoning, vision };
}

function pickString(raw: CacheModelRaw, keys: string[]): string | undefined {
	for (const key of keys) {
		const value = raw[key];
		if (typeof value === "string" && value.trim()) return value.trim();
	}
	return undefined;
}

function pickInt(raw: CacheModelRaw, keys: string[]): number | undefined {
	for (const key of keys) {
		const value = raw[key];
		if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.floor(value);
	}
	return undefined;
}

function pickBool(raw: CacheModelRaw, keys: string[]): boolean | undefined {
	for (const key of keys) {
		const value = raw[key];
		if (typeof value === "boolean") return value;
	}
	return undefined;
}
