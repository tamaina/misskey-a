/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { ModuleRef } from '@nestjs/core';
import { ChannelsApiProvider } from '../../backend/api.implementation.js';
test('feature composition resolves initialized singletons once and caches its router', () => {
	const moduleRef = mockDeep<ModuleRef>();
	moduleRef.get.mockReturnValue(mockDeep());
	const provider = new ChannelsApiProvider(moduleRef);
	expect(moduleRef.get).not.toHaveBeenCalled();
	const router = provider.compose();
	const lookups = moduleRef.get.mock.calls.length;
	expect(lookups).toBeGreaterThan(0);
	expect(provider.compose()).toBe(router);
	expect(moduleRef.get).toHaveBeenCalledTimes(lookups);
	for (const [, options] of moduleRef.get.mock.calls) expect(options).toEqual({ strict: false });
});
