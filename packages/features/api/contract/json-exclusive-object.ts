/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';
import { jsonNumber } from './json-number.js';
import { getJsonObjectSchemaRegistration } from './json-object.js';
import { selectorCommonObjectEntries } from './json-selector-and-common-fields.js';

type JsonObjectSchema = v.GenericSchema<Record<string, unknown>, Record<string, unknown>>;
type Options = readonly [JsonObjectSchema, JsonObjectSchema];
export interface JsonExclusiveObjectRegistration {
	readonly schema: v.GenericSchema;
	readonly guard: v.GenericSchema;
	readonly parser: v.GenericTransformation;
	readonly options: Options;
}
const schemas = new WeakMap<object, JsonExclusiveObjectRegistration>();
const guards = new WeakMap<object, JsonExclusiveObjectRegistration>();
const parsers = new WeakMap<object, JsonExclusiveObjectRegistration>();
const tuples = new WeakMap<object, JsonExclusiveObjectRegistration>();

/** Deliberately bounded: required finite numeric fields and one nested JSON-object level. */
function admitObject(schema: object, depth = 0): void {
	if (depth > 1) throw new Error('Exclusive objects permit at most one nested object level');
	for (const field of Object.values(selectorCommonObjectEntries(schema))) {
		if (getJsonObjectSchemaRegistration(field) !== undefined) {
			admitObject(field, depth + 1);
			continue;
		}
		if (field === jsonNumber) continue;
		const pipe: unknown = Reflect.get(field, 'pipe');
		if (Reflect.get(field, 'kind') !== 'schema' || Reflect.get(field, 'async') !== false
			|| 'fallback' in field || 'default' in field || !Array.isArray(pipe) || pipe[0] !== jsonNumber || pipe.length < 2) {
			throw new Error('Exclusive object fields require default-free finite numbers or original JSON objects');
		}
		for (const action of pipe.slice(1)) {
			if (action === null || typeof action !== 'object' || 'pipe' in action
				|| action.kind !== 'validation' || action.async !== false) throw new Error('Exclusive object fields cannot transform values');
			const numericBound = ((action.type === 'min_value' && action.reference === v.minValue)
				|| (action.type === 'max_value' && action.reference === v.maxValue))
				&& typeof action.requirement === 'number' && Number.isFinite(action.requirement);
			if (!(action.type === 'integer' && action.reference === v.integer) && !numericBound) {
				throw new Error('Exclusive object fields contain an unsupported numeric action');
			}
			Object.freeze(action);
		}
		Object.freeze(pipe); Object.freeze(field);
	}
}

/** Validate both unchanged original inputs; exactly one must succeed. Stable own-JSON data only. */
export function jsonExclusiveObject<const First extends JsonObjectSchema, const Second extends JsonObjectSchema>(options: readonly [First, Second]) {
	if (!Array.isArray(options) || options.length !== 2) throw new Error('Exclusive objects require exactly two alternatives');
	for (const option of options) admitObject(option);
	const captured: readonly [First, Second] = Object.freeze([options[0], options[1]]);
	type Input = v.InferInput<First> | v.InferInput<Second>;
	type Output = v.InferOutput<First> | v.InferOutput<Second>;
	const guard = Object.freeze(v.custom<Input>(value => value !== null && typeof value === 'object' && !Array.isArray(value), 'Expected a JSON object'));
	const parser = Object.freeze(v.rawTransform<Input, Output>(({ dataset, config, addIssue, NEVER }) => {
		const message = config.message;
		const parseConfig = { abortEarly: config.abortEarly, abortPipeEarly: config.abortPipeEarly, lang: config.lang,
			message: typeof message === 'function' ? (issue: v.BaseIssue<unknown>) => Reflect.apply(message, undefined, [issue]) : message };
		const first = v.safeParse(captured[0], dataset.value, parseConfig);
		const second = v.safeParse(captured[1], dataset.value, parseConfig);
		if (first.success && !second.success) return first.output;
		if (second.success && !first.success) return second.output;
		addIssue({ message: 'Expected exactly one matching JSON object alternative' });
		return NEVER;
	}));
	const pipeline = v.pipe(guard, parser);
	Object.freeze(pipeline.pipe);
	const schema: v.BaseSchema<Input, Output, v.BaseIssue<unknown>> = Object.freeze(pipeline);
	const registration = Object.freeze({ schema, guard, parser, options: captured });
	schemas.set(schema, registration); guards.set(guard, registration); parsers.set(parser, registration); tuples.set(captured, registration);
	return schema;
}
export const getJsonExclusiveObjectSchemaRegistration = (schema: object) => schemas.get(schema);
export const getJsonExclusiveObjectGuardRegistration = (schema: object) => guards.get(schema);
export const getJsonExclusiveObjectParserRegistration = (schema: object) => parsers.get(schema);
export const getJsonExclusiveObjectOptionsRegistration = (schema: object) => tuples.get(schema);
