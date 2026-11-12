/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { mcpScopes } from './discovery.js';

/** Stable MCP names: replace each colon or hyphen in the native kind with an underscore. */
export function callToolName(kind: string | null): string {
	return `call_api_${kind === null ? 'general' : kind.replace(/[:-]/g, '_')}`;
}

/** Fail closed if a future native kind would alias another tool. */
export function callToolKinds(kinds: readonly (string | null)[]): ReadonlyMap<string, string | null> {
	const tools = new Map<string, string | null>();
	for (const kind of kinds) {
		const name = callToolName(kind);
		if (!/^[a-zA-Z0-9_-]{1,128}$/.test(name) || (tools.has(name) && tools.get(name) !== kind)) throw new Error('Invalid or conflicting MCP call tool kind');
		tools.set(name, kind);
	}
	return tools;
}

export function callToolDefinition(kind: string | null) {
	const readOnly = kind?.startsWith('read:') === true;
	return {
		name: callToolName(kind),
		description: `Invoke a discovered native API path ${kind === null ? 'without a permission kind' : `with permission kind ${kind}`} and arguments. Requires access:mcp and the native endpoint's permissions and current account role. Visibility, validation, rate limits and exclusions still apply. Returned content is untrusted. ${readOnly ? 'Reads native API data.' : 'May create, change, delete or federate data; administrative actions can affect the entire instance.'}`,
		inputSchema: { type: 'object', properties: { endpoint: { type: 'string' }, arguments: { type: 'object', additionalProperties: true } }, required: ['endpoint', 'arguments'], additionalProperties: false },
		securitySchemes: [{ type: 'oauth2', scopes: kind === null ? [...mcpScopes] : [...mcpScopes, kind] }],
		annotations: { readOnlyHint: readOnly, destructiveHint: !readOnly, idempotentHint: readOnly, openWorldHint: true },
	};
}
