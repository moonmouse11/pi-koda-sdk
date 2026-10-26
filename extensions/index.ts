import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

import { loadSdkConfig, saveSdkConfig } from "../src/config.js";
import { PACKAGE_VERSION } from "../src/constants.js";
import { formatRoutingHints } from "../src/koda-routing.js";
import { findKodaAuthPath, findKodaConfigPath, findKodaModelsCachePath } from "../src/koda-paths.js";
import { readModelOverrideIndex } from "../src/koda-model-meta.js";
import { collectSdkEndpointSources } from "../src/sdk/endpoints.js";
import { buildDoctorReport } from "../src/sdk/doctor.js";
import { registerKodaSdkProviders } from "../src/sdk/register.js";

export default function kodaSdkExtension(pi: ExtensionAPI): void {
	const registry = registerKodaSdkProviders(pi);
	registry.scheduleStartupDiscovery();

	async function doctor(ctx: ExtensionCommandContext, verbose: boolean): Promise<void> {
		const sdk = loadSdkConfig();
		const lines = [
			`pi-koda-sdk ${PACKAGE_VERSION} (SDK / OpenAI-compatible)`,
			`endpoints: ${registry.endpoints.length}`,
			...(await buildDoctorReport(registry.endpoints, {
				verbose,
				signal: verbose ? AbortSignal.timeout(15_000) : undefined,
			})),
			`~/.pi/agent/koda-sdk.json: ${sdk.baseUrl ?? "(no baseUrl override)"}`,
			`KODA_BASE_URL: ${process.env.KODA_BASE_URL ?? "(unset)"}`,
			`koda config.yaml: ${findKodaConfigPath() ?? "not found"}`,
			`koda auth.yaml: ${findKodaAuthPath() ?? "not found"}`,
			`models-cache.json: ${findKodaModelsCachePath() ?? "not found"}`,
			`model_overrides: ${readModelOverrideIndex().size}`,
		];
		lines.push(...formatRoutingHints());
		ctx.ui.notify(lines.join("\n"), registry.endpoints.length ? "info" : "warning");
	}

	function sources(ctx: ExtensionCommandContext): void {
		const { lines: sourceLines } = collectSdkEndpointSources();
		ctx.ui.notify(
			["Koda SDK endpoint sources (merge order):", ...sourceLines, "", `Active endpoints: ${registry.endpoints.length}`].join(
				"\n",
			),
			"info",
		);
	}

	async function reload(ctx: ExtensionCommandContext): Promise<void> {
		ctx.ui.notify("Reloading Koda SDK providers…", "info");
		const count = await registry.reload(AbortSignal.timeout(15_000));
		ctx.ui.notify(
			count
				? `Reloaded ${registry.endpoints.length} endpoint(s), ${count} model(s) from API. Open /model.`
				: `Reloaded ${registry.endpoints.length} endpoint(s). No models from API (check keys and URLs).`,
			registry.endpoints.length ? "info" : "warning",
		);
	}

	async function refreshModels(ctx: ExtensionCommandContext): Promise<void> {
		ctx.ui.notify("Refreshing Koda SDK model catalogs…", "info");
		const count = await registry.refreshDiscovery(AbortSignal.timeout(15_000));
		ctx.ui.notify(
			count ? `Refreshed ${count} model(s). Open /model.` : "No models discovered (check KODA_API_KEY and base URL).",
			count ? "info" : "warning",
		);
	}

	pi.registerCommand("koda", {
		description: "Koda SDK: doctor, reload, and model catalog refresh",
		handler: async (args, ctx) => {
			const [sub = "", ...rest] = args.trim().split(/\s+/u);

			switch (sub.toLowerCase()) {
				case "doctor":
					return doctor(ctx, false);
				case "doctor-verbose":
					return doctor(ctx, true);
				case "sources":
					return sources(ctx);
				case "reload":
					return reload(ctx);
				case "models":
					if (rest[0] === "refresh") return refreshModels(ctx);
					break;
				case "base-url":
					if (rest.length) {
						saveSdkConfig({ baseUrl: rest.join(" ") });
						ctx.ui.notify("Saved base URL to ~/.pi/agent/koda-sdk.json. Run /koda reload.", "info");
						return;
					}
					break;
			}

			ctx.ui.notify(
				[
					"Usage:",
					"  /koda doctor",
					"  /koda doctor-verbose",
					"  /koda sources",
					"  /koda reload",
					"  /koda models refresh",
					"  /koda base-url https://api.example.com/v1",
					"",
					"Models: koda/<model> or koda-<provider>/<model> from env, koda-sdk.json, or Koda config.yaml",
				].join("\n"),
				"info",
			);
		},
	});
}
