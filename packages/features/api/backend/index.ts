/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { toJsonSchema } from '@valibot/to-json-schema';
import type { JsonSchema } from '@valibot/to-json-schema';
import { getJsonStringLegacySchema, objectParams, misskeyId } from '../contract/index.js';
import { getUniqueStringArrayBaseSchema } from '../contract/unique-string-array.js';
import { assertUniqueStringArrayMetadata } from './unique-string-array-projection.js';

// Keep the portable schema builder available alongside the legacy schema bridge.
export { jsonString } from '../contract/index.js';

export function toLegacyJsonSchema(
	schema: Parameters<typeof toJsonSchema>[0],
	config?: Parameters<typeof toJsonSchema>[1],
): JsonSchema {
	assertUniqueStringArrayMetadata(schema);
	const defaultOverrideSchema = ({ valibotSchema }: { valibotSchema: object }): JsonSchema | undefined => {
		const jsonStringSchema = getJsonStringLegacySchema(valibotSchema);
		if (jsonStringSchema !== undefined) return jsonStringSchema;
		if (valibotSchema === objectParams) return { type: 'object', properties: {}, additionalProperties: true };
		if (valibotSchema === misskeyId) return { type: 'string', format: 'misskey:id' };
		return undefined;
	};
	const overrideSchema = config?.overrideSchema === undefined
		? defaultOverrideSchema
		: (context: Parameters<NonNullable<typeof config.overrideSchema>>[0]) => {
			const overridden = config.overrideSchema!(context);
			return overridden !== undefined
				? overridden
				: defaultOverrideSchema(context);
		};
	const defaultOverrideAction = ({ valibotAction, jsonSchema }: Parameters<NonNullable<NonNullable<typeof config>['overrideAction']>>[0]): JsonSchema | undefined => {
		if (getUniqueStringArrayBaseSchema(valibotAction) === undefined) return undefined;
		if (jsonSchema.type !== 'array' || !jsonSchema.items || typeof jsonSchema.items !== 'object'
			|| Array.isArray(jsonSchema.items) || jsonSchema.items.type !== 'string') {
			throw new Error('Unique string arrays require an array of string items');
		}
		return { ...jsonSchema, uniqueItems: true };
	};
	const overrideAction = config?.overrideAction === undefined
		? defaultOverrideAction
		: (context: Parameters<NonNullable<typeof config.overrideAction>>[0]) => {
			const overridden = config.overrideAction!(context);
			return overridden !== undefined && overridden !== null
				? overridden
				: defaultOverrideAction(context);
		};
	const { $schema: _dialect, ...legacySchema } = toJsonSchema(schema, {
		...config,
		overrideSchema,
		overrideAction,
	});
	return legacySchema;
}

export { featureProcedure } from './procedure.js';
