/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Packed } from '@features/index/contract/packed.js';
import type * as v from 'valibot';
import type { EmojiSimple, EmojiDetailed } from '@features/emojis/contract';
import type { packedEmojiSimpleSchema, packedEmojiDetailedSchema } from '@features/emojis/contract/packed.js';
import { expect, expectTypeOf, test, vi } from 'vitest';
import type { InstanceFeature } from '@features/instance/backend';
import type { StatisticsFeature } from '@features/statistics/backend';
import { defineFeatureEndpoint } from './feature-endpoint.js';

test('feature binding preserves the typed factory without constructing a handler', () => {
	const factory = vi.fn((statistics: StatisticsFeature) => ({ exec: statistics.stats }));
	const binding = defineFeatureEndpoint('statistics', factory);
	expect(binding.feature).toBe('statistics');
	expect(binding.createEndpoint).toBe(factory);
	expect(factory).not.toHaveBeenCalled();
	expectTypeOf<Parameters<typeof binding.createEndpoint>[0]>().toEqualTypeOf<StatisticsFeature>();
});

test('feature mismatches and non-handler factories are compile-time errors', () => {
	const instanceFactory = (instance: InstanceFeature) => ({ exec: instance.ping });
	defineFeatureEndpoint('instance', instanceFactory);
	// These factories are never invoked; backend typecheck verifies each rejection.
	// @ts-expect-error A statistics binding cannot consume an instance feature.
	defineFeatureEndpoint('statistics', instanceFactory);
	// @ts-expect-error Unregistered feature names cannot be bound.
	defineFeatureEndpoint('missing', instanceFactory);
	// @ts-expect-error An endpoint factory must return an executable handler.
	defineFeatureEndpoint('statistics', () => 1);
});

test('legacy packed emoji types resolve from the feature contract', () => {
	expectTypeOf<Packed<'EmojiSimple'>>().toEqualTypeOf<EmojiSimple>();
	expectTypeOf<Packed<'EmojiDetailed'>>().toEqualTypeOf<EmojiDetailed>();
	expectTypeOf<keyof typeof packedEmojiSimpleSchema.entries>().toEqualTypeOf<keyof EmojiSimple>();
	expectTypeOf<v.InferOutput<typeof packedEmojiDetailedSchema>>().toEqualTypeOf<EmojiDetailed>();
	expectTypeOf<Packed<'EmojiSimple'>['localOnly']>().toEqualTypeOf<boolean | undefined>();
	expectTypeOf<Packed<'EmojiDetailed'>['host']>().toEqualTypeOf<string | null>();
});
