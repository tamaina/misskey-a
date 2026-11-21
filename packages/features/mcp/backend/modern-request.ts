/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { McpEventError } from './events-protocol.js';

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
export function modernRequest(body: unknown, headers: Record<string, string | string[] | undefined>) {
	if (!record(body) || body.jsonrpc !== '2.0' || !(typeof body.id === 'string' || typeof body.id === 'number' && Number.isSafeInteger(body.id)) || typeof body.method !== 'string') throw new McpEventError(-32600, 'Invalid request');
	if (!record(body.params) || !record(body.params._meta)) throw new McpEventError(-32602, 'Required MCP metadata missing');
	const meta = body.params._meta;
	const version = meta['io.modelcontextprotocol/protocolVersion'];
	if (typeof version !== 'string' || !record(meta['io.modelcontextprotocol/clientCapabilities'])) throw new McpEventError(-32602, 'Required MCP metadata missing');
	if (headers['mcp-protocol-version'] !== version || headers['mcp-method'] !== body.method) throw new McpEventError(-32020, 'MCP header mismatch');
	if (version !== '2026-07-28') return { id: body.id, method: body.method, unsupported: version, params: {} };
	if (body.method === 'tools/call') {
		let name = headers['mcp-name'];
		if (typeof name === 'string' && name.startsWith('=?base64?') && name.endsWith('?=')) {
			const encoded = name.slice(9, -2); const decoded = Buffer.from(encoded, 'base64');
			if (decoded.toString('base64') !== encoded) throw new McpEventError(-32020, 'MCP header mismatch');
			name = decoded.toString('utf8');
		}
		if (typeof name !== 'string' || name !== body.params.name) throw new McpEventError(-32020, 'MCP header mismatch');
	}
	const { _meta, ...params } = body.params;
	return { id: body.id, method: body.method, params, unsupported: undefined };
}
