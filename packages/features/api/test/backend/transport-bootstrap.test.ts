/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { setTimeout as delay } from 'node:timers/promises';
import { Module, type InjectionToken, type Provider } from '@nestjs/common';
import { ModuleRef, NestFactory } from '@nestjs/core';
import Fastify from 'fastify';
import { expect, test } from 'vitest';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { OrpcPilotService } from '../../backend/transport/OrpcPilotService.js';

function injectionToken(value: unknown): InjectionToken {
	if (typeof value === 'string' || typeof value === 'symbol' || typeof value === 'function') return value;
	throw new Error('Expected a Nest constructor injection token');
}

test('the real transport resolves completed operation providers after Nest bootstrap', async () => {
	const constructorTypes = v.parse(v.array(v.unknown()), Reflect.getMetadata('design:paramtypes', OrpcPilotService));
	const tokens = constructorTypes.map(injectionToken);
	const explicit = v.parse(v.array(v.object({ index: v.number(), param: v.unknown() })),
		Reflect.getMetadata('self:paramtypes', OrpcPilotService) ?? []);
	for (const parameter of explicit) tokens[parameter.index] = injectionToken(parameter.param);

	const calls: unknown[] = [];
	const lookups: string[] = [];
	// Nest first exposes a prototype placeholder and later replaces it with the
	// constructed instance. A delayed provider makes constructor-time capture fail.
	let usersInstance: object = {};
	const delayedProvider = Symbol('completed operation provider');
	const lookup = { get: (token: InjectionToken) => {
		const name = typeof token === 'function' ? token.name : String(token);
		lookups.push(name);
		return name === 'UsersApplicationService' ? usersInstance : {};
	} };
	const providers: Provider[] = [...new Set(tokens)].map(token => ({
		provide: token,
		useValue: token === ModuleRef ? lookup
		: token === DI.config ? { maxFileSize: 1024, enableIpRateLimit: false }
		: token === DI.meta ? { enableServerMachineStats: false }
		: typeof token === 'function' && token.name === 'AuthenticateService' ? { authenticate: async () => [null, null] }
		: typeof token === 'function' && token.name === 'TelemetryService' ? { startSpan: (_name: string, run: () => Promise<unknown>) => run() }
		: {},
	}));
	providers.push(OrpcPilotService, {
		provide: delayedProvider,
		useFactory: async () => {
			await delay(10);
			usersInstance = {
				'users/achievements': async (input: unknown) => { calls.push(input); return []; },
			};
			return usersInstance;
		},
	});
	class TestModule {}
	Module({ providers })(TestModule);
	const nest = await NestFactory.createApplicationContext(TestModule, { logger: false, abortOnError: false });
	const app = Fastify();
	try {
		expect(lookups).toEqual([]);
		await app.register(async api => nest.get(OrpcPilotService).register(api), { prefix: '/api' });
		const response = await app.inject({ method: 'POST', url: '/api/users/achievements', payload: { userId: 'user123' } });
		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual([]);
		expect(calls).toEqual([{ userId: 'user123' }]);
		expect(lookups).toContain('UsersApplicationService');
		const count = lookups.length;
		await app.inject({ method: 'POST', url: '/api/users/achievements', payload: { userId: 'user456' } });
		expect(lookups).toHaveLength(count);
		expect(calls).toEqual([{ userId: 'user123' }, { userId: 'user456' }]);
	} finally {
		await app.close();
		await nest.close();
	}
});
