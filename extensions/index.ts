import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";

import { loadSdkConfig, saveSdkConfig } from "../src/config.js";
import { PACKAGE_VERSION } from "../src/constants.js";
import { formatPrimaryModelHint } from "../src/koda-routing.js";
import { findKodaAuthPath, findKodaConfigPath } from "../src/koda-paths.js";
import { buildDoctorReport } from "../src/sdk/doctor.js";
import { registerKodaSdkProviders } from "../src/sdk/register.js";

export default function kodaSdkExtension(pi: ExtensionAPI): void {
	const registry = registerKodaSdkProviders(pi);
	registry.scheduleStartupDiscovery();

	pi.registerCommand("koda", {
		description: "Koda SDK: doctor, reload, and model catalog refresh",
		handler: async (args, ctx) => {
			const parts = args.trim().split(/\s+/u);
			const sub = parts[0]?.toLowerCase();

			if (sub === "doctor" || sub === "doctor-verbose") {
				const verbose = sub === "doctor-verbose";
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
				];
				const hint = formatPrimaryModelHint();
				if (hint) lines.push(hint);
				ctx.ui.notify(lines.join("\n"), registry.endpoints.length ? "info" : "warning");
				return;
			}

			if (sub === "reload") {
				ctx.ui.notify("Reloading Koda SDK providers…", "info");
				const count = await registry.reload(AbortSignal.timeout(15_000));
				ctx.ui.notify(
					count
						? `Reloaded ${registry.endpoints.length} endpoint(s), ${count} model(s) from API. Open /model.`
						: `Reloaded ${registry.endpoints.length} endpoint(s). No models from API (check keys and URLs).`,
					registry.endpoints.length ? "info" : "warning",
				);
				return;
			}

			if (sub === "models" && parts[1] === "refresh") {
				ctx.ui.notify("Refreshing Koda SDK model catalogs…", "info");
				const count = await registry.refreshDiscovery(AbortSignal.timeout(15_000));
				ctx.ui.notify(
					count ? `Refreshed ${count} model(s). Open /model.` : "No models discovered (check KODA_API_KEY and base URL).",
					count ? "info" : "warning",
				);
				return;
			}

			if (sub === "base-url" && parts[1]) {
				saveSdkConfig({ baseUrl: parts.slice(1).join(" ") });
				ctx.ui.notify("Saved base URL to ~/.pi/agent/koda-sdk.json. Run /koda reload.", "info");
				return;
			}

			usage(
				ctx,
				[
					"Usage:",
					"  /koda doctor",
					"  /koda doctor-verbose",
					"  /koda reload",
					"  /koda models refresh",
					"  /koda base-url https://api.example.com/v1",
					"",
					"Models: koda/<model> or koda-<provider>/<model> from env, koda-sdk.json, or Koda config.yaml",
				].join("\n"),
			);
		},
	});
}

function usage(ctx: ExtensionCommandContext, message: string): void {
	ctx.ui.notify(message, "info");
}
