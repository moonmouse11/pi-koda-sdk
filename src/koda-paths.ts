import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CONFIG_CANDIDATES = [
	path.join(os.homedir(), ".koda", "config.yaml"),
	path.join(os.homedir(), ".config", "kodacode", "config.yaml"),
	path.join(os.homedir(), ".config", "koda", "config.yaml"),
];

const AUTH_CANDIDATES = [
	path.join(os.homedir(), ".koda", "auth.yaml"),
	path.join(os.homedir(), ".config", "kodacode", "auth.yaml"),
	path.join(os.homedir(), ".config", "koda", "auth.yaml"),
];

export function findKodaConfigPath(): string | undefined {
	for (const candidate of CONFIG_CANDIDATES) {
		try {
			if (fs.statSync(candidate).isFile()) return candidate;
		} catch {
			/* try next */
		}
	}
	return undefined;
}

export function findKodaAuthPath(): string | undefined {
	for (const candidate of AUTH_CANDIDATES) {
		try {
			if (fs.statSync(candidate).isFile()) return candidate;
		} catch {
			/* try next */
		}
	}
	return undefined;
}

export function kodaDataDir(): string {
	const xdg = process.env.XDG_DATA_HOME?.trim();
	if (xdg) return path.join(xdg, "kodacode");
	return path.join(os.homedir(), ".local", "share", "kodacode");
}

export function findKodaModelsCachePath(): string | undefined {
	const candidate = path.join(kodaDataDir(), "models-cache.json");
	try {
		if (fs.statSync(candidate).isFile()) return candidate;
	} catch {
		/* missing */
	}
	return undefined;
}
