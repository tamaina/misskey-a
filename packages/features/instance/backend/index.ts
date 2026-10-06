/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createProcedureClient, implement } from '@orpc/server';
import { toJsonSchema } from '@valibot/to-json-schema';
import type { JsonSchema } from '@valibot/to-json-schema';
import { instanceContract, pingParams, pingResult } from '../contract/index.js';

/** The clock is a narrow dependency and can be replaced without a container. */
export function createPing(now: () => number = Date.now) {
	return createProcedureClient(implement(instanceContract.ping).handler(() => ({ pong: now() })));
}

// Transitional documentation/AJV bridge. The Valibot schema remains authoritative.
// This endpoint uses only object/number schemas, with all response fields required.
const { $schema: _inputDialect, ...input } = toJsonSchema(pingParams, {
	overrideSchema: ({ valibotSchema }) => valibotSchema === pingParams
		? { type: 'object', properties: {}, additionalProperties: true }
		: undefined,
});
const { $schema: _outputDialect, ...output } = toJsonSchema(pingResult);
export const legacyPingSchemas: { input: JsonSchema; output: JsonSchema } = { input, output };
