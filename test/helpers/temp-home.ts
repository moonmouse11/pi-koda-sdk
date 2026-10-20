import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export interface TempHome {
	root: string;
	restore: () => void;
}

export function withTempHome(fn: (home: TempHome) => void): void {
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
	try {
		fn(temp);
	} finally {
		temp.restore();
	}
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
