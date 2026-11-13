/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import Fastify, { LogController } from 'fastify';
import { registerMcpTransport } from './transport.js';
import type { McpApiService } from './McpApiService.js';

export interface LocalMcpOptions {
	enabled?: boolean;
	/** Explicit local resource; the public server instead uses trusted config.url. */
	resource?: string;
	allowedOrigins?: readonly string[];
}

/** Standalone loopback test wrapper around the same handler as the normal server. */
export function createLocalMcpPilot(service: McpApiService, options: LocalMcpOptions = {}) {
	const app = Fastify({ logger: false, logController: new LogController({ disableRequestLogging: true }), trustProxy: false, bodyLimit: 1024 * 1024, requestTimeout: 30000 });
	if (!options.enabled) return { app, close: () => {}, activeRequests: () => 0, nativeInFlight: () => 0 };
	return registerMcpTransport(app, service, { resource: options.resource ?? '', loopbackOnly: true, allowedOrigins: options.allowedOrigins });
}
