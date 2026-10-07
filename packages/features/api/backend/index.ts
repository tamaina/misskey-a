/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getGlobalDefs, toJsonSchema } from '@valibot/to-json-schema';
import type { JsonSchema } from '@valibot/to-json-schema';
import { getJsonStringLegacySchema, objectParams, misskeyId } from '../contract/index.js';
import { getUniqueStringArrayBaseSchema } from '../contract/unique-string-array.js';
import { jsonNumber } from '../contract/json-number.js';
import { getJsonObjectParserRegistration } from '../contract/json-object.js';
import { assertJsonObjectMetadata } from './json-object-projection.js';
import { jsonObjectProjectionView } from './json-object-projection-view.js';
import { assertUniqueStringArrayMetadata } from './unique-string-array-projection.js';
import { getRequireWhenAllNullishRegistration } from '../contract/require-when-all-nullish.js';
import { assertRequireWhenAllNullishPlacement } from './require-when-all-nullish-projection.js';

// Keep the portable schema builder available alongside the legacy schema bridge.
export { jsonString } from '../contract/index.js';

export function toLegacyJsonSchema(
	schema: Parameters<typeof toJsonSchema>[0],
	config?: Parameters<typeof toJsonSchema>[1],
): JsonSchema {
	assertRequireWhenAllNullishPlacement(schema);
	assertJsonObjectMetadata(schema);
	const definitions = config?.definitions ?? getGlobalDefs();
	for (const definition of Object.values(definitions ?? {})) {
		assertRequireWhenAllNullishPlacement(definition);
		assertJsonObjectMetadata(definition);
	}
	assertUniqueStringArrayMetadata(schema);
	const projection = jsonObjectProjectionView(schema, definitions);
	const mapProxies = new WeakMap<object, object>();
	const source = (value: unknown) => value !== null && (typeof value === 'object' || typeof value === 'function')
		? projection.originals.get(value) ?? value : value;

	function originalMap<T extends object>(map: T): T {
		const existing = mapProxies.get(map);
		if (existing !== undefined) return existing as T;
		const proxy = new Proxy(map, { get(target, key) {
			const member = Reflect.get(target, key, target);
			if (typeof member !== 'function') return member;
			if (['get', 'has', 'delete'].includes(String(key))) return (value: object) => source(
				Reflect.apply(member, target, [projection.views.get(value) ?? value]),
			);
			if (key === 'set') return (value: object, next: unknown) => {
				Reflect.apply(member, target, [projection.views.get(value) ?? value,
					next !== null && (typeof next === 'object' || typeof next === 'function') ? projection.views.get(next) ?? next : next]);
				return proxy;
			};
			if (key === Symbol.iterator || key === 'entries') return function* () {
				for (const [entry, value] of Reflect.apply(member, target, [])) yield [source(entry), source(value)];
			};
			if (key === 'keys' || key === 'values') return function* () {
				for (const value of Reflect.apply(member, target, [])) yield source(value);
			};
			if (key === 'forEach') return (callback: (value: unknown, key: unknown, map: unknown) => unknown, thisArg?: unknown) => Reflect.apply(member, target, [
				(value: unknown, entry: unknown) => Reflect.apply(callback, thisArg, [source(value), source(entry), proxy]),
			]);
			return member.bind(target);
		} });
		mapProxies.set(map, proxy);
		return proxy;
	}

	function originalContext<T extends { referenceMap: object; getterMap: object }>(context: T) {
		return { ...context, referenceMap: originalMap(context.referenceMap), getterMap: originalMap(context.getterMap) };
	}

	const defaultOverrideSchema = ({ valibotSchema }: { valibotSchema: object }): JsonSchema | undefined => {
		const jsonStringSchema = getJsonStringLegacySchema(valibotSchema);
		if (jsonStringSchema !== undefined) return jsonStringSchema;
		if (valibotSchema === objectParams) return { type: 'object', properties: {}, additionalProperties: true };
		if (valibotSchema === jsonNumber) return { type: 'number' };
		if (valibotSchema === misskeyId) return { type: 'string', format: 'misskey:id' };
		return undefined;
	};
	const overrideSchema = (context: Parameters<NonNullable<NonNullable<typeof config>['overrideSchema']>>[0]): JsonSchema | null | undefined => {
		const aliases = projection.schemaAliases.get(context.valibotSchema)
			?? [projection.originals.get(context.valibotSchema) ?? context.valibotSchema];
		const namedBase = projection.namedBaseViews.get(context.valibotSchema);
		for (const alias of aliases) {
			if (alias === namedBase) continue;
			const original = { ...originalContext(context), valibotSchema: alias as typeof context.valibotSchema };
			const supplied = config?.overrideSchema?.(original);
			if (supplied !== undefined) return supplied;
			const fallback = defaultOverrideSchema(original);
			if (fallback !== undefined) return fallback;
		}
		if (namedBase !== undefined) {
			const namedView = projection.views.get(namedBase) ?? namedBase;
			const referenceId = context.referenceMap.get(namedView as typeof context.valibotSchema);
			if (referenceId === undefined) throw new Error('Named JSON-object base is missing its converter reference');
			const jsonSchema = { $ref: '#/$defs/' + referenceId.replaceAll('~', '~0').replaceAll('/', '~1') };
			const overridden = config?.overrideRef?.({ ...originalContext(context), referenceId,
				valibotSchema: namedBase as typeof context.valibotSchema, jsonSchema });
			return overridden ? { $ref: overridden } : jsonSchema;
		}
		return undefined;
	};
	const defaultOverrideAction = ({ valibotAction, jsonSchema }: Parameters<NonNullable<NonNullable<typeof config>['overrideAction']>>[0]): JsonSchema | undefined => {
		if (getJsonObjectParserRegistration(valibotAction) !== undefined) return jsonSchema;
		const conditional = getRequireWhenAllNullishRegistration(valibotAction);
		if (conditional !== undefined) {
			const required = getJsonStringLegacySchema(conditional.schema);
			if (required === undefined || jsonSchema.type !== 'object') {
				throw new Error('Nullish conditional projection requires its canonical string and object base');
			}
			const result = {
				...jsonSchema,
				if: { properties: Object.fromEntries(conditional.dependencies.map(key => [key, { type: 'null' as const }])) },
				then: { properties: { [conditional.key]: required }, required: [conditional.key] },
			};
			if (result.required?.length === 0) delete result.required;
			return result;
		}
		if (getUniqueStringArrayBaseSchema(valibotAction) === undefined) return undefined;
		if (jsonSchema.type !== 'array' || !jsonSchema.items || typeof jsonSchema.items !== 'object'
			|| Array.isArray(jsonSchema.items) || jsonSchema.items.type !== 'string') {
			throw new Error('Unique string arrays require an array of string items');
		}
		return { ...jsonSchema, uniqueItems: true };
	};
	const overrideAction = (context: Parameters<NonNullable<NonNullable<typeof config>['overrideAction']>>[0]): JsonSchema | undefined => {
		const original = { ...context, valibotAction: (projection.originals.get(context.valibotAction) ?? context.valibotAction) as typeof context.valibotAction };
		const supplied = config?.overrideAction?.(original);
		return supplied !== undefined && supplied !== null ? supplied : defaultOverrideAction(original);
	};
	const customRef = config?.overrideRef;
	const overrideRef = customRef === undefined ? undefined : (context: Parameters<typeof customRef>[0]) => customRef({
		...originalContext(context), valibotSchema: (projection.originals.get(context.valibotSchema) ?? context.valibotSchema) as typeof context.valibotSchema,
	});
	const { $schema: _dialect, ...legacySchema } = toJsonSchema(projection.schema as typeof schema, {
		...config,
		definitions: projection.definitions as NonNullable<typeof config>['definitions'],
		overrideRef,
		overrideSchema,
		overrideAction,
	});
	return legacySchema;
}

export { featureProcedure } from './procedure.js';
