/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';

export interface JsonObjectRegistration {
	readonly guard: v.GenericSchema;
	readonly base: v.GenericSchema;
	readonly parser: v.GenericTransformation;
}
const schemaRegistrations = new WeakMap<object, JsonObjectRegistration>();
const guardRegistrations = new WeakMap<object, JsonObjectRegistration>();
const parserRegistrations = new WeakMap<object, JsonObjectRegistration>();

/** Candidate public parser: validate/default known fields and safely retain every unknown own key. */
export function jsonObject<const Entries extends v.ObjectEntries>(entries: Entries) {
	const capturedEntries = Object.freeze({ ...entries });
	const base = Object.freeze(v.looseObject(capturedEntries));
	return objectContract(entries, base);
}

/** Validate every extension through its public schema, including prototype-related own keys. */
export function jsonObjectWithRest<const Entries extends v.ObjectEntries, const Rest extends v.GenericSchema>(entries: Entries, rest: Rest) {
	return objectContract(entries, v.objectWithRest(Object.freeze({ ...entries }), rest), rest);
}

function objectContract<
	const Entries extends v.ObjectEntries,
	Base extends v.LooseObjectSchema<Entries, undefined> | v.ObjectWithRestSchema<Entries, v.GenericSchema, undefined>,
>(entries: Entries, baseSchema: Base, rest?: v.GenericSchema) {
	const capturedEntries = baseSchema.entries;
	if (Object.prototype.hasOwnProperty.call(entries, '__proto__')) {
		throw new Error('JSON-object contracts cannot declare the prototype-mutating __proto__ field');
	}
	const base = Object.freeze(baseSchema);
	const guard = Object.freeze(v.custom<v.InferInput<typeof base>>(
		value => value !== null && typeof value === 'object' && !Array.isArray(value)
			&& (rest === undefined || ((Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
				&& Object.getOwnPropertySymbols(value).length === 0)),
		'Expected a JSON object',
	));
	const parser = Object.freeze(v.rawTransform<v.InferInput<typeof base>, v.InferOutput<typeof base>>(({ dataset, config, addIssue, NEVER }) => {
		const input = dataset.value;
		if (input === null || typeof input !== 'object' || Array.isArray(input)) {
			addIssue({ message: 'Expected a JSON object' });
			return NEVER;
		}
		const message = config.message;
		const parseConfig = {
			abortEarly: config.abortEarly,
			abortPipeEarly: config.abortPipeEarly,
			lang: config.lang,
			message: typeof message === 'function' ? (issue: v.BaseIssue<unknown>) => Reflect.apply(message, undefined, [issue]) : message,
		};
		const result = v.safeParse(base, input, parseConfig);
		if (!result.success) {
			for (const issue of result.issues) {
				addIssue({ input: issue.input, expected: issue.expected ?? undefined, received: issue.received, message: issue.message, path: issue.path });
			}
			return NEVER;
		}
		for (const key of Object.keys(input)) {
			if (Object.prototype.hasOwnProperty.call(capturedEntries, key)) continue;
			const value = Reflect.get(input, key);
			if (rest !== undefined) {
				// Stock objectWithRest already parsed ordinary keys; repair only skipped own keys.
				if (Object.hasOwn(result.output, key)) continue;
				const extension = v.safeParse(rest, value, parseConfig);
				if (!extension.success) {
					for (const issue of extension.issues) {
						addIssue({ input: issue.input, expected: issue.expected ?? undefined, received: issue.received, message: issue.message,
							path: [{ type: 'object', origin: 'value', input, key, value }, ...(issue.path ?? [])] });
					}
					return NEVER;
				}
				Object.defineProperty(result.output, key, { value: extension.output, enumerable: true, configurable: true, writable: true });
			} else {
				Object.defineProperty(result.output, key, { value, enumerable: true, configurable: true, writable: true });
			}
		}
		return result.output;
	}));
	const registration = Object.freeze({ guard, base, parser });
	guardRegistrations.set(guard, registration);
	parserRegistrations.set(parser, registration);
	const schema = Object.assign(v.pipe(guard, parser), { entries: capturedEntries });
	Object.freeze(schema.pipe);
	const typed: v.BaseSchema<v.InferInput<typeof base>, v.InferOutput<typeof base>, v.BaseIssue<unknown>> & { readonly entries: typeof capturedEntries; readonly pipe: typeof schema.pipe } = Object.freeze(schema);
	schemaRegistrations.set(typed, registration);
	return typed;
}

export function getJsonObjectGuardRegistration(schema: object): JsonObjectRegistration | undefined {
	return guardRegistrations.get(schema);
}
export function getJsonObjectParserRegistration(action: object): JsonObjectRegistration | undefined {
	return parserRegistrations.get(action);
}

/** Recognize the exact frozen wrapper returned by jsonObject, without accepting copies. */
export function getJsonObjectSchemaRegistration(schema: object): JsonObjectRegistration | undefined {
	return schemaRegistrations.get(schema);
}
