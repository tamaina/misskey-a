/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { expect, test } from 'vitest';
import { resultObject } from '@features/api/contract/result-object.js';

const declaredResult = resultObject({
	id: v.string(),
	count: v.optional(v.number()),
});
const opaqueResult = resultObject({});

type DeclaredInput = v.InferInput<typeof declaredResult>;
type DeclaredOutput = v.InferOutput<typeof declaredResult>;
type StandardTypes = NonNullable<typeof declaredResult['~standard']['types']>;
type OpaqueInput = v.InferInput<typeof opaqueResult>;
type OpaqueOutput = v.InferOutput<typeof opaqueResult>;
type OpaqueStandardTypes = NonNullable<typeof opaqueResult['~standard']['types']>;
type DeclaredShape = { id: string; count?: number | undefined };
type Assignable<From, To> = [From] extends [To] ? true : false;
type Assert<T extends true> = T;

export type ResultObjectTypeAssertions = [
	Assert<Assignable<DeclaredInput, DeclaredShape>>,
	Assert<Assignable<DeclaredShape, DeclaredInput>>,
	Assert<Assignable<DeclaredOutput, DeclaredShape>>,
	Assert<Assignable<DeclaredShape, DeclaredOutput>>,
	Assert<Assignable<StandardTypes['input'], DeclaredShape>>,
	Assert<Assignable<DeclaredShape, StandardTypes['input']>>,
	Assert<Assignable<StandardTypes['output'], DeclaredShape>>,
	Assert<Assignable<DeclaredShape, StandardTypes['output']>>,
	Assert<Assignable<OpaqueInput, object>>,
	Assert<Assignable<object, OpaqueInput>>,
	Assert<Assignable<OpaqueOutput, object>>,
	Assert<Assignable<object, OpaqueOutput>>,
	Assert<Assignable<OpaqueStandardTypes['input'], object>>,
	Assert<Assignable<object, OpaqueStandardTypes['input']>>,
	Assert<Assignable<OpaqueStandardTypes['output'], object>>,
	Assert<Assignable<object, OpaqueStandardTypes['output']>>,
	Assert<string extends keyof DeclaredInput ? false : true>,
	Assert<string extends keyof DeclaredOutput ? false : true>,
	Assert<string extends keyof OpaqueInput ? false : true>,
	Assert<string extends keyof OpaqueOutput ? false : true>,
];

test('result objects expose only declared fields to Valibot and Standard Schema types', () => {
	const input: DeclaredInput = { id: 'sample', count: undefined };
	const expectedInput: StandardTypes['input'] = { id: 'sample' };
	const output: DeclaredOutput = { id: 'sample' };
	const expectedOutput: StandardTypes['output'] = { id: 'sample' };
	const opaqueInput: OpaqueInput = {};
	const opaqueStandardInput: OpaqueStandardTypes['input'] = {};
	// @ts-expect-error An empty result object still rejects primitive inputs.
	const invalidOpaqueInput: OpaqueInput = 1;
	// @ts-expect-error Standard Schema input is also constrained to objects.
	const invalidOpaqueStandardInput: OpaqueStandardTypes['input'] = 1;
	// @ts-expect-error An empty result object never infers a primitive output.
	const invalidOpaqueOutput: OpaqueOutput = 'not an object';
	// @ts-expect-error Standard Schema output is also constrained to objects.
	const invalidOpaqueStandardOutput: OpaqueStandardTypes['output'] = 'not an object';
	// @ts-expect-error Declared field types are retained for InferInput.
	const invalidInput: DeclaredInput = { id: 1 };
	// @ts-expect-error Declared field types are retained for InferOutput.
	const invalidOutput: DeclaredOutput = { id: 1 };
	// @ts-expect-error Standard Schema input also retains declared field types.
	const invalidStandardInput: StandardTypes['input'] = { id: 1 };
	// @ts-expect-error Standard Schema output also retains declared field types.
	const invalidStandardOutput: StandardTypes['output'] = { id: 1 };

	const parsed = v.parse(declaredResult, { id: 'sample', extra: { preserved: true } });
	expect(parsed).toEqual({ id: 'sample', extra: { preserved: true } });
	// @ts-expect-error Runtime passthrough does not widen the declared output type.
	void parsed.extra;

	const parsedOpaque = v.parse(opaqueResult, { extra: { preserved: true } });
	expect(parsedOpaque).toEqual({ extra: { preserved: true } });
	// @ts-expect-error Opaque extra keys are preserved at runtime but are not declared fields.
	void parsedOpaque.extra;
	void [
		input,
		expectedInput,
		output,
		expectedOutput,
		opaqueInput,
		opaqueStandardInput,
		invalidOpaqueInput,
		invalidOpaqueStandardInput,
		invalidOpaqueOutput,
		invalidOpaqueStandardOutput,
		invalidInput,
		invalidOutput,
		invalidStandardInput,
		invalidStandardOutput,
	];
});
