import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export interface KodaSdkConfig {
	/** Override OpenAI-compatible base URL (without trailing /v1). */
	baseUrl?: string;
}

function sdkConfigPath(): string {
	const home = process.env.HOME?.trim() || os.homedir();
	return path.join(home, ".pi", "agent", "koda-sdk.json");
}

export function loadSdkConfig(): KodaSdkConfig {
	try {
		const raw = fs.readFileSync(sdkConfigPath(), "utf8");
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
	const configPath = sdkConfigPath();
	fs.mkdirSync(path.dirname(configPath), { recursive: true });
	fs.writeFileSync(configPath, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
	return next;
}
