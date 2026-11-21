/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { ModuleRef } from '@nestjs/core';
import type { Redis } from 'ioredis';
import { DI } from '@/di-symbols.js';
import { AuthSessionApiProvider } from '../../backend/api.implementation.js';

test('actual session provider composes once using the existing Redis DI token', () => {
	const moduleRef = mockDeep<ModuleRef>(); const redis = mockDeep<Redis>();
	moduleRef.get.mockImplementation(token => {
		if (token === undefined) throw new Error('Undefined provider token');
		return token === DI.redis ? redis : mockDeep();
	});
	const provider = new AuthSessionApiProvider(moduleRef);
	const router = provider.compose(); expect(router.authSessions.signinFlow).toBeDefined(); expect(provider.compose()).toBe(router);
	expect(moduleRef.get).toHaveBeenCalledWith(DI.redis, { strict: false });
	expect(moduleRef.get.mock.calls.filter(([token]) => token === DI.redis)).toHaveLength(1);
	expect(redis.eval).not.toHaveBeenCalled();
});
