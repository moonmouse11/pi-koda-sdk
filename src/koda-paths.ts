import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function userHome(): string {
	const home = process.env.HOME?.trim();
	return home || os.homedir();
}

function configCandidates(): string[] {
	const home = userHome();
	return [
		path.join(home, ".koda", "config.yaml"),
		path.join(home, ".config", "kodacode", "config.yaml"),
		path.join(home, ".config", "koda", "config.yaml"),
	];
}

function authCandidates(): string[] {
	const home = userHome();
	return [
		path.join(home, ".koda", "auth.yaml"),
		path.join(home, ".config", "kodacode", "auth.yaml"),
		path.join(home, ".config", "koda", "auth.yaml"),
	];
}

export function findKodaConfigPath(): string | undefined {
	for (const candidate of configCandidates()) {
		try {
			if (fs.statSync(candidate).isFile()) return candidate;
		} catch {
			/* try next */
		}
	}
	return undefined;
}

export function findKodaAuthPath(): string | undefined {
	for (const candidate of authCandidates()) {
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
	return path.join(userHome(), ".local", "share", "kodacode");
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
