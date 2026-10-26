import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, it, mock } from "node:test";

import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

import kodaSdkExtension from "../extensions/index.js";
import { writeKodaAuth, writeKodaConfig, withTempHome } from "./helpers/temp-home.js";

interface FakePi {
	pi: ExtensionAPI;
	providers: Map<string, { models: Array<{ id: string }> }>;
	run: (args: string) => Promise<Array<{ message: string; level: string }>>;
}

function fakePi(): FakePi {
	const providers = new Map<string, { models: Array<{ id: string }> }>();
	let handler: ((args: string, ctx: ExtensionCommandContext) => Promise<void>) | undefined;
	const pi = {
		registerProvider: (id: string, config: { models: Array<{ id: string }> }) => providers.set(id, config),
		unregisterProvider: (id: string) => providers.delete(id),
		registerCommand: (_name: string, command: { handler: typeof handler }) => {
			handler = command.handler;
		},
	} as unknown as ExtensionAPI;
	return {
		pi,
		providers,
		run: async (args) => {
			const notes: Array<{ message: string; level: string }> = [];
			const ctx = { ui: { notify: (message: string, level: string) => notes.push({ message, level }) } };
			await handler?.(args, ctx as unknown as ExtensionCommandContext);
			return notes;
		},
	};
}

// GET <base>/models answers with one model named after the host; anything else fails
function mockModelsApi(): void {
	mock.method(globalThis, "fetch", async (url: string) => {
		const host = new URL(url).hostname.split(".")[0];
		if (host === "down") return new Response("nope", { status: 503, statusText: "Service Unavailable" });
		return Response.json({ data: [{ id: `${host}-model` }] });
	});
}

function writeTwoProviders(root: string): void {
	writeKodaConfig(
		root,
		`
version: 1
providers:
  - id: up
    base_url: https://up.example/v1
  - id: down
    base_url: https://down.example/v1
models:
  - provider: down
    model: down-static
`,
	);
	writeKodaAuth(root, "up:\n  access: sk-up-key-123456\ndown:\n  access: sk-down-key-123456\n");
}

describe("koda extension", () => {
	const savedEnv = { base: process.env.KODA_BASE_URL, key: process.env.KODA_API_KEY };

	beforeEach(() => {
		delete process.env.KODA_BASE_URL;
		delete process.env.KODA_API_KEY;
		mockModelsApi();
	});

	afterEach(() => {
		mock.restoreAll();
		if (savedEnv.base !== undefined) process.env.KODA_BASE_URL = savedEnv.base;
		if (savedEnv.key !== undefined) process.env.KODA_API_KEY = savedEnv.key;
	});

	it("refreshes models per endpoint and keeps the static catalog when an endpoint fails", () =>
		withTempHome(async ({ root }) => {
			writeTwoProviders(root);
			const { pi, providers, run } = fakePi();
			kodaSdkExtension(pi);

			const notes = await run("models refresh");
			assert.deepEqual(notes.at(-1), { message: "Refreshed 1 model(s). Open /model.", level: "info" });
			assert.deepEqual(providers.get("koda-up")?.models.map((m) => m.id), ["up-model"]);
			assert.deepEqual(providers.get("koda-down")?.models.map((m) => m.id), ["down-static"]);
		}));

	it("reports health of every endpoint in order", () =>
		withTempHome(async ({ root }) => {
			writeTwoProviders(root);
			const { pi, run } = fakePi();
			kodaSdkExtension(pi);

			const [plain] = await run("doctor");
			assert.match(plain?.message ?? "", /endpoints: 2\n {2}• koda-up ← https:\/\/up\.example\/v1 .*\n {2}• koda-down/u);
			assert.equal(plain?.level, "info");

			const [verbose] = await run("doctor-verbose");
			assert.match(verbose?.message ?? "", /koda-up[^\n]*\n {4}GET https:\/\/up\.example\/v1\/models\n {4}→ 200 .*models: 1\n {2}• koda-down/u);
			assert.match(verbose?.message ?? "", /→ failed \(503\) .*Service Unavailable/u);
		}));

	it("lists sources, reloads, saves base URL, and shows usage otherwise", () =>
		withTempHome(async ({ root }) => {
			writeTwoProviders(root);
			const { pi, run } = fakePi();
			kodaSdkExtension(pi);

			assert.match((await run("sources"))[0]?.message ?? "", /Active endpoints: 2/u);
			assert.equal((await run("reload")).at(-1)?.message, "Reloaded 2 endpoint(s), 1 model(s) from API. Open /model.");

			await run("base-url https://custom.example/v1");
			const saved = JSON.parse(fs.readFileSync(path.join(root, ".pi", "agent", "koda-sdk.json"), "utf8"));
			assert.equal(saved.baseUrl, "https://custom.example/v1");

			for (const args of ["", "models", "base-url", "nope"]) {
				assert.match((await run(args))[0]?.message ?? "", /^Usage:/u, `args: "${args}"`);
			}
		}));

	it("never sends Koda's key to a non-Koda provider", () =>
		withTempHome(async ({ root }) => {
			process.env.KODA_API_KEY = "sk-koda-env-123456";
			writeKodaConfig(
				root,
				`
version: 1
providers:
  - id: koda-chat-models
    base_url: https://koda.example/v1
  - id: openrouter
    base_url: https://openrouter.example/v1
`,
			);
			writeKodaAuth(root, "koda:\n  access: sk-koda-file-123456\n");
			const fetchMock = mock.method(globalThis, "fetch", async () => Response.json({ data: [] }));
			const { pi, providers, run } = fakePi();
			kodaSdkExtension(pi);
			await run("doctor-verbose");

			const sent = fetchMock.mock.calls.map((call) => {
				const [url, init] = call.arguments as [string, RequestInit];
				return [new URL(url).hostname, (init.headers as Record<string, string>).Authorization];
			});
			assert.ok(sent.length > 0);
			assert.ok(sent.every(([host]) => host === "koda.example"), JSON.stringify(sent));
			assert.ok(providers.has("koda-koda-chat-models"));
			assert.equal(providers.has("koda-openrouter"), false);
		}));

	it("ignores a startup refresh that finishes after a reload", () =>
		withTempHome(async ({ root }) => {
			writeTwoProviders(root);
			let releaseStartup: () => void = () => {};
			const startupDone = new Promise<void>((resolve) => {
				releaseStartup = resolve;
			});
			let calls = 0;
			mock.method(globalThis, "fetch", async (url: string) => {
				// the first two calls are startup discovery for "up" and "down": hold them
				if (++calls <= 2) await startupDone;
				return Response.json({ data: [{ id: `${new URL(url).hostname.split(".")[0]}-model` }] });
			});
			const { pi, providers, run } = fakePi();
			kodaSdkExtension(pi);

			writeKodaConfig(root, "version: 1\nproviders:\n  - id: up\n    base_url: https://up.example/v1\n");
			await run("reload");
			releaseStartup();
			await new Promise((resolve) => setImmediate(resolve));

			assert.equal(providers.has("koda-down"), false);
		}));

	it("warns when no endpoint is configured", () =>
		withTempHome(async () => {
			const { pi, run } = fakePi();
			kodaSdkExtension(pi);
			assert.equal((await run("doctor"))[0]?.level, "warning");
			assert.equal((await run("reload")).at(-1)?.level, "warning");
			assert.equal((await run("models refresh")).at(-1)?.level, "warning");
		}));
});
