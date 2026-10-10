/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const mcpScopes = ['access:mcp'] as const;
export const mcpMetadataPath = '/.well-known/oauth-protected-resource/mcp';

/** Derive identity only from trusted configuration, never incoming authority headers. */
export const mcpResource = (issuer: string) => new URL('/mcp', issuer).href;
export const mcpMetadataUrl = (resource: string) => new URL(mcpMetadataPath, resource).href;

export function mcpChallenge(resource: string, error?: 'invalid_token' | 'insufficient_scope') {
	return `Bearer realm="Misskey MCP", resource_metadata="${mcpMetadataUrl(resource)}"`
		+ (error ? `, error="${error}"` : '')
		+ (error === 'invalid_token' ? ', error_description="Authentication required."' : '')
		+ (error === 'insufficient_scope' ? ', error_description="MCP permission required.", scope="access:mcp"' : '');
}
