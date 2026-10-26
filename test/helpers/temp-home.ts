import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export interface TempHome {
	root: string;
	restore: () => void;
}

export function withTempHome<T>(fn: (home: TempHome) => T): T {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "pi-koda-sdk-"));
	const prevHome = process.env.HOME;
	const prevXdg = process.env.XDG_DATA_HOME;
	process.env.HOME = root;
	delete process.env.XDG_DATA_HOME;
	const temp: TempHome = {
		root,
		restore: () => {
			process.env.HOME = prevHome;
			if (prevXdg === undefined) delete process.env.XDG_DATA_HOME;
			else process.env.XDG_DATA_HOME = prevXdg;
			fs.rmSync(root, { recursive: true, force: true });
		},
	};
	let result: T;
	try {
		result = fn(temp);
	} catch (err) {
		temp.restore();
		throw err;
	}
	if (result instanceof Promise) return result.finally(temp.restore) as T;
	temp.restore();
	return result;
}

export function writeKodaConfig(homeRoot: string, yaml: string): void {
	const dir = path.join(homeRoot, ".config", "kodacode");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(path.join(dir, "config.yaml"), yaml, "utf8");
}

export function writeKodaAuth(homeRoot: string, yaml: string): void {
	const dir = path.join(homeRoot, ".config", "kodacode");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(path.join(dir, "auth.yaml"), yaml, "utf8");
}

export function writeModelsCache(homeRoot: string, json: unknown): void {
	const dir = path.join(homeRoot, "kodacode-data", "kodacode");
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(path.join(dir, "models-cache.json"), JSON.stringify(json), "utf8");
	process.env.XDG_DATA_HOME = path.join(homeRoot, "kodacode-data");
}
