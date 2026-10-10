/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { FastifyInstance } from 'fastify';
import type { Config } from '@/config.js';
import type { McpApiService } from './McpApiService.js';
import { registerMcpTransport } from './transport.js';

/** Existing issuer-local scoped credentials serve the same native API via MCP. */
export async function registerMcpServer(app: FastifyInstance, service: McpApiService, config: Pick<Config, 'url' | 'enableMcp'>) {
	if (config.enableMcp !== true) {
		// Reserve the protocol path so the SPA catch-all cannot pretend to be MCP.
		app.all('/mcp', { config: { sensitiveAccessLogBody: true } }, (_request, reply) => reply.code(404).send());
		return;
	}
	registerMcpTransport(app, service, { resource: new URL('/mcp', config.url).href });
}
