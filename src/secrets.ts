/** Mask a secret for doctor output (keeps prefix/suffix hints only). */
export function maskSecret(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return "(empty)";
	if (trimmed.length <= 8) return "****";
	return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)}`;
}
