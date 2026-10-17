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
