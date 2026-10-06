/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createProcedureClient, implement } from '@orpc/server';
import { toJsonSchema } from '@valibot/to-json-schema';
import type { JsonSchema } from '@valibot/to-json-schema';
import { instanceContract, objectParams, pingResult, serverInfoResult } from '../contract/index.js';
import type { InstanceEndpoints } from '../contract/index.js';

/** The clock is a narrow dependency and can be replaced without a container. */
export function createPing(now: () => number = Date.now) {
	return createProcedureClient(implement(instanceContract.ping).handler(() => ({ pong: now() })));
}

export interface ServerInfoDependencies {
	enabled(): boolean;
	read(): Promise<InstanceEndpoints['server-info']['res']>;
}

/** Check current settings on every request before reading machine information. */
export function createServerInfo(deps: ServerInfoDependencies) {
	return createProcedureClient(implement(instanceContract['server-info']).handler(async () => {
		if (!deps.enabled()) return {
			machine: '?', cpu: { model: '?', cores: 0 },
			mem: { total: 0 }, fs: { total: 0, used: 0 },
		};
		return deps.read();
	}));
}

// Transitional documentation/AJV bridge. The Valibot schema remains authoritative.
// These endpoints use object/string/number schemas, with response fields required.
const { $schema: _inputDialect, ...input } = toJsonSchema(objectParams, {
	overrideSchema: ({ valibotSchema }) => valibotSchema === objectParams
		? { type: 'object', properties: {}, additionalProperties: true }
		: undefined,
});
const { $schema: _outputDialect, ...output } = toJsonSchema(pingResult);
export const legacyPingSchemas: { input: JsonSchema; output: JsonSchema } = { input, output };
const { $schema: _serverInfoDialect, ...serverInfoOutput } = toJsonSchema(serverInfoResult);
export const legacyServerInfoSchemas: { input: JsonSchema; output: JsonSchema } = { input, output: serverInfoOutput };
