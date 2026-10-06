/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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
