/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';
import { admitSelectorCommonObject } from './json-selector-and-common-fields.js';

type JsonObjectSchema = v.GenericSchema<Record<string, unknown>, Record<string, unknown>>;
type JsonSelectorOptions = readonly [JsonObjectSchema, JsonObjectSchema]
	| readonly [JsonObjectSchema, JsonObjectSchema, JsonObjectSchema];

export type WithCommon<Selector, Common> = Selector extends unknown ? Selector & Common : never;

export interface JsonSelectorUnionRegistration {
	readonly schema: v.GenericSchema;
	readonly options: JsonSelectorOptions;
}
export interface JsonSelectorAndCommonRegistration {
	readonly schema: v.GenericSchema;
	readonly guard: v.GenericSchema;
	readonly parser: v.GenericTransformation;
	readonly selector: v.GenericSchema;
	readonly common: v.GenericSchema;
}
const unionRegistrations = new WeakMap<object, JsonSelectorUnionRegistration>();
const unionOptionsRegistrations = new WeakMap<object, JsonSelectorUnionRegistration>();
const schemaRegistrations = new WeakMap<object, JsonSelectorAndCommonRegistration>();
const guardRegistrations = new WeakMap<object, JsonSelectorAndCommonRegistration>();
const parserRegistrations = new WeakMap<object, JsonSelectorAndCommonRegistration>();

function copyOptions<const Options extends JsonSelectorOptions>(options: Options): readonly [...Options] {
	return [...options];
}

function hasSelectorArity(options: readonly JsonObjectSchema[]): options is JsonSelectorOptions {
	return options.length === 2 || options.length === 3;
}

/** A registered, ordered public union of exactly two or three original JSON-object selectors. */
export function jsonSelectorUnion<const Options extends JsonSelectorOptions>(options: Options) {
	if (!Array.isArray(options) || (options.length !== 2 && options.length !== 3)) {
		throw new Error('Selector/common unions require exactly two or three alternatives');
	}
	for (const option of options) admitSelectorCommonObject(option, false);
	const captured = copyOptions<Options>(options);
	// A separately narrowed registration view keeps the native tuple's exact generic inference.
	const registrationOptions: readonly JsonObjectSchema[] = captured;
	if (!hasSelectorArity(registrationOptions)) throw new Error('Selector/common unions require exactly two or three alternatives');
	Object.freeze(captured);
	const schema = Object.freeze(v.union(captured));
	const registration = Object.freeze({ schema, options: registrationOptions });
	unionRegistrations.set(schema, registration);
	unionOptionsRegistrations.set(captured, registration);
	return schema;
}

/** Parse the same original input through the selector and common schemas, then safely spread. */
export function jsonSelectorAndCommon<const Selector extends JsonObjectSchema, const Common extends JsonObjectSchema>(selector: Selector, common: Common) {
	const union = getJsonSelectorUnionRegistration(selector);
	if (union === undefined) throw new Error('Selector/common parsing requires its original registered selector union');
	const commonKeys = new Set(admitSelectorCommonObject(common, true));
	for (const option of union.options) {
		for (const key of admitSelectorCommonObject(option, false)) {
			if (commonKeys.has(key)) throw new Error('Selector/common declared fields must be disjoint');
		}
	}
	type Input = WithCommon<v.InferInput<Selector>, v.InferInput<Common>>;
	// Intersection distributes over the real selector union, retaining both loose indices.
	type Output = v.InferOutput<Selector> & v.InferOutput<Common>;
	const guard = Object.freeze(v.custom<Input>(
		value => value !== null && typeof value === 'object' && !Array.isArray(value),
		'Expected a JSON object',
	));
	const parser = Object.freeze(v.rawTransform<Input, Output>(({ dataset, config, addIssue, NEVER }) => {
		const message = config.message;
		const parseConfig = {
			abortEarly: config.abortEarly,
			abortPipeEarly: config.abortPipeEarly,
			lang: config.lang,
			message: typeof message === 'function' ? (issue: v.BaseIssue<unknown>) => Reflect.apply(message, undefined, [issue]) : message,
		};
		const selected = v.safeParse(selector, dataset.value, parseConfig);
		if (!selected.success) {
			for (const issue of selected.issues) addIssue({ input: issue.input, expected: issue.expected ?? undefined, received: issue.received, message: issue.message, path: issue.path });
			return NEVER;
		}
		const shared = v.safeParse(common, dataset.value, parseConfig);
		if (!shared.success) {
			for (const issue of shared.issues) addIssue({ input: issue.input, expected: issue.expected ?? undefined, received: issue.received, message: issue.message, path: issue.path });
			return NEVER;
		}
		return { ...selected.output, ...shared.output };
	}));
	const schema = v.pipe(guard, parser);
	Object.freeze(schema.pipe);
	const typed: v.BaseSchema<Input, Output, v.BaseIssue<unknown>> = Object.freeze(schema);
	const registration = Object.freeze({ schema: typed, guard, parser, selector, common });
	schemaRegistrations.set(typed, registration);
	guardRegistrations.set(guard, registration);
	parserRegistrations.set(parser, registration);
	return typed;
}

export function getJsonSelectorUnionRegistration(schema: object): JsonSelectorUnionRegistration | undefined {
	const registration = unionRegistrations.get(schema);
	if (registration !== undefined && (!Object.isFrozen(schema) || Reflect.get(schema, 'options') !== registration.options
		|| !Object.isFrozen(registration.options))) throw new Error('Selector/common union registration has changed');
	return registration;
}
/** Exact owned tuple provenance; copies never gain the original union's registration. */
export function getJsonSelectorUnionOptionsRegistration(options: object): JsonSelectorUnionRegistration | undefined {
	return unionOptionsRegistrations.get(options);
}
export function getJsonSelectorAndCommonSchemaRegistration(schema: object): JsonSelectorAndCommonRegistration | undefined {
	return schemaRegistrations.get(schema);
}
export function getJsonSelectorAndCommonGuardRegistration(schema: object): JsonSelectorAndCommonRegistration | undefined {
	return guardRegistrations.get(schema);
}
export function getJsonSelectorAndCommonParserRegistration(action: object): JsonSelectorAndCommonRegistration | undefined {
	return parserRegistrations.get(action);
}
