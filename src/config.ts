import fs from "node:fs";
import path from "node:path";

export interface KodaSdkConfig {
	/** Override OpenAI-compatible base URL (without trailing /v1). */
	baseUrl?: string;
}

const CONFIG_PATH = path.join(process.env.HOME ?? "", ".pi", "agent", "koda-sdk.json");

export function loadSdkConfig(): KodaSdkConfig {
	try {
		const raw = fs.readFileSync(CONFIG_PATH, "utf8");
		const parsed = JSON.parse(raw) as Partial<KodaSdkConfig>;
		return {
			baseUrl: typeof parsed.baseUrl === "string" && parsed.baseUrl.trim() ? parsed.baseUrl.trim() : undefined,
		};
	} catch {
		return {};
	}
}

export function saveSdkConfig(patch: Partial<KodaSdkConfig>): KodaSdkConfig {
	const current = loadSdkConfig();
	const next: KodaSdkConfig = {
		baseUrl: patch.baseUrl === undefined ? current.baseUrl : patch.baseUrl?.trim() || undefined,
	};
	fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
	fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
	return next;
}
