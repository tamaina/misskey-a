/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: MIT
 */

import { expectAssignable, expectNotAssignable } from 'tsd';
import type * as v from 'valibot';
import type { entities } from '../built/index.js';
import type { components } from '../built/autogen/types.js';
import type { JsonValue, jsonValueSchema } from '../built/contracts/api/contract/json-value.js';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
export type Cases = [
	Assert<Equal<entities.JsonValue, JsonValue>>,
	Assert<Equal<components['schemas']['JsonValue'], JsonValue>>,
	Assert<Equal<v.InferInput<typeof jsonValueSchema>, JsonValue>>,
	Assert<Equal<v.InferOutput<typeof jsonValueSchema>, JsonValue>>,
];

expectAssignable<entities.JsonValue>({ future: [null, true, 'text', 3, { nested: [] }] });
expectNotAssignable<entities.JsonValue>(undefined);
expectNotAssignable<entities.JsonValue>(new Date());
expectNotAssignable<entities.JsonValue>(1n);
expectNotAssignable<entities.JsonValue>({ native: undefined });
