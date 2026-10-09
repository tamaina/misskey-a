/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expectTypeOf, test } from 'vitest';
import type { Serialized } from '@features/runtime/backend/types.js';
import type { JsonObject, JsonValue } from '@features/runtime/backend/formatting/json-value.js';
import type { Packed } from '@features/index/backend/packed.schema.js';

test('serialized opaque metadata is represented as JSON after the event boundary', () => {
	expectTypeOf<Serialized<{ value: unknown }>>().toEqualTypeOf<{ value: JsonValue }>();
	expectTypeOf<Serialized<{ metadata: Record<string, unknown> }>>().toMatchTypeOf<{ metadata: JsonObject }>();
	expectTypeOf<Serialized<Packed<'Page'>>>().toMatchTypeOf<JsonObject>();
});

test('serialized dates retain their established string representation', () => {
	expectTypeOf<Serialized<{ at: Date; nullableAt: Date | null }>>()
		.toEqualTypeOf<{ at: string; nullableAt: string | null }>();
});
