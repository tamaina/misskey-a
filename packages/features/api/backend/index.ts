/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toJsonSchema } from '@valibot/to-json-schema';
import type { JsonSchema } from '@valibot/to-json-schema';
import { objectParams } from '../contract/index.js';

export function toLegacyJsonSchema(
	schema: Parameters<typeof toJsonSchema>[0],
	config?: Parameters<typeof toJsonSchema>[1],
): JsonSchema {
	const { $schema: _dialect, ...legacySchema } = toJsonSchema(schema, {
		overrideSchema: ({ valibotSchema }) => valibotSchema === objectParams
			? { type: 'object', properties: {}, additionalProperties: true }
			: undefined,
		...config,
	});
	return legacySchema;
}
