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
	if (Object.prototype.hasOwnProperty.call(capturedEntries, '__proto__')) {
		throw new Error('JSON-object contracts cannot declare the prototype-mutating __proto__ field');
	}
	const base = Object.freeze(v.looseObject(capturedEntries));
	const guard = Object.freeze(v.custom<v.InferInput<typeof base>>(
		value => value !== null && typeof value === 'object' && !Array.isArray(value),
		'Expected a JSON object',
	));
	const parser = Object.freeze(v.rawTransform<v.InferInput<typeof base>, v.InferOutput<typeof base>>(({ dataset, config, addIssue, NEVER }) => {
		const input = dataset.value;
		if (input === null || typeof input !== 'object' || Array.isArray(input)) {
			addIssue({ message: 'Expected a JSON object' });
			return NEVER;
		}
		const message = config.message;
		const result = v.safeParse(base, input, {
			abortEarly: config.abortEarly,
			abortPipeEarly: config.abortPipeEarly,
			lang: config.lang,
			message: typeof message === 'function' ? issue => Reflect.apply(message, undefined, [issue]) : message,
		});
		if (!result.success) {
			for (const issue of result.issues) {
				addIssue({ input: issue.input, expected: issue.expected ?? undefined, received: issue.received, message: issue.message, path: issue.path });
			}
			return NEVER;
		}
		for (const key of Object.keys(input)) {
			if (Object.prototype.hasOwnProperty.call(capturedEntries, key)) continue;
			Object.defineProperty(result.output, key, {
				value: input[key], enumerable: true, configurable: true, writable: true,
			});
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
