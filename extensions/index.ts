import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

import { loadSdkConfig, saveSdkConfig } from "../src/config.js";
import { PACKAGE_VERSION } from "../src/constants.js";
import { findKodaAuthPath, findKodaConfigPath } from "../src/koda-paths.js";
import { registerKodaSdkProviders } from "../src/sdk/register.js";

export default function kodaSdkExtension(pi: ExtensionAPI): void {
	const registry = registerKodaSdkProviders(pi);

	pi.registerCommand("koda", {
		description: "Koda SDK: doctor and model catalog refresh",
		handler: async (args, ctx) => {
			const parts = args.trim().split(/\s+/u);
			const sub = parts[0]?.toLowerCase();

			if (sub === "doctor" || sub === "doctor-verbose") {
				const sdk = loadSdkConfig();
				const lines = [
					`pi-koda-sdk ${PACKAGE_VERSION} (SDK / OpenAI-compatible)`,
					`endpoints: ${registry.endpoints.length}`,
					...registry.endpoints.map(
						(e) => `  • ${endpointPiProviderId(e)} ← ${e.baseUrl} (${e.source})`,
					),
					`~/.pi/agent/koda-sdk.json: ${sdk.baseUrl ?? "(no baseUrl override)"}`,
					`KODA_BASE_URL: ${process.env.KODA_BASE_URL ?? "(unset)"}`,
					`koda config.yaml: ${findKodaConfigPath() ?? "not found"}`,
					`koda auth.yaml: ${findKodaAuthPath() ?? "not found"}`,
				];
				ctx.ui.notify(lines.join("\n"), registry.endpoints.length ? "info" : "warning");
				return;
			}

			if (sub === "models" && parts[1] === "refresh") {
				ctx.ui.notify("Refreshing Koda SDK model catalogs…", "info");
				const count = await registry.refreshDiscovery();
				ctx.ui.notify(
					count ? `Refreshed ${count} model(s). Open /model.` : "No models discovered (check KODA_API_KEY and base URL).",
					count ? "info" : "warning",
				);
				return;
			}

			if (sub === "base-url" && parts[1]) {
				saveSdkConfig({ baseUrl: parts.slice(1).join(" ") });
				ctx.ui.notify("Saved base URL to ~/.pi/agent/koda-sdk.json. Restart Pi to reload providers.", "info");
				return;
			}

			usage(
				ctx,
				[
					"Usage:",
					"  /koda doctor",
					"  /koda models refresh",
					"  /koda base-url https://api.example.com/v1",
					"",
					"Models: koda/<model> or koda-<provider>/<model> from env, koda-sdk.json, or ~/.koda/config.yaml",
				].join("\n"),
			);
		},
	});
}

function endpointPiProviderId(e: { providerId: string }): string {
	return e.providerId === "koda" ? "koda" : `koda-${e.providerId}`;
}

function usage(ctx: ExtensionCommandContext, message: string): void {
	ctx.ui.notify(message, "info");
}
