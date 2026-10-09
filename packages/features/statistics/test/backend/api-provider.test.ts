/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { expect, test } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { ModuleRef } from '@nestjs/core';
import { StatisticsApiProvider } from '../../backend/api.implementation.js';
import { OperationsApiProvider } from '../../../operations/backend/api.implementation.js';
import { FederationApiProvider } from '../../../federation/backend/api.implementation.js';
import { PortabilityApiProvider } from '../../../portability/backend/api.implementation.js';
import { DI } from '@/di-symbols.js';
for (const Provider of [StatisticsApiProvider, OperationsApiProvider, FederationApiProvider, PortabilityApiProvider]) {
	test(`${Provider.name} resolves singleton dependencies only at composition and caches the router`, () => {
		const moduleRef = mockDeep<ModuleRef>();
		const provider = new Provider(moduleRef);
		expect(moduleRef.get).not.toHaveBeenCalled();
		const router = provider.compose();
		const resolutions = moduleRef.get.mock.calls.length;
		expect(resolutions).toBeGreaterThan(0);
		expect(provider.compose()).toBe(router);
		expect(moduleRef.get).toHaveBeenCalledTimes(resolutions);
		for (const resolution of moduleRef.get.mock.calls) expect(resolution[1]).toEqual({ strict: false });
	});
}
test('federation composition retains both original relationship repository tokens', () => {
	const moduleRef = mockDeep<ModuleRef>();
	new FederationApiProvider(moduleRef).compose();
	expect(moduleRef.get).toHaveBeenCalledWith(DI.followingsRepository, { strict: false });
	// The original remove-all-following binding uses notesRepository; preserve it in this wiring change.
	expect(moduleRef.get).toHaveBeenCalledWith(DI.notesRepository, { strict: false });
});
