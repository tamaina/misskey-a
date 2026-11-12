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

export function callToolDefinition(kind: string | null, endpoints: readonly string[]) {
	const readOnly = kind?.startsWith('read:') === true;
	return {
		name: callToolName(kind),
		description: kind === null ? 'Call APIs with no permission kind' : `Call ${kind} API`,
		inputSchema: { type: 'object', properties: { endpoint: { type: 'string', enum: [...endpoints] }, arguments: { type: 'object', additionalProperties: true } }, required: ['endpoint', 'arguments'], additionalProperties: false },
		securitySchemes: [{ type: 'oauth2', scopes: kind === null ? [...mcpScopes] : [...mcpScopes, kind] }],
		annotations: { readOnlyHint: readOnly, destructiveHint: !readOnly, idempotentHint: readOnly, openWorldHint: true },
	};
}
