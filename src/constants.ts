import packageJson from "../package.json" with { type: "json" };

export const PACKAGE_VERSION = packageJson.version;
export const PROVIDER_ID = "koda";
