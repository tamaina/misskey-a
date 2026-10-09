/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import 'reflect-metadata';
import { describe, expect, test, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ModuleRef } from '@nestjs/core';
import type { InjectionToken, Provider } from '@nestjs/common';
import Fastify from 'fastify';
import * as v from 'valibot';
import { DI } from '@/di-symbols.js';
import { OrpcPilotService } from '@features/api/backend/transport/OrpcPilotService.js';
import { Logger } from '@features/runtime/backend/logging/logger.js';
import { envOption } from '@/env.js';
import { logManager } from '@features/runtime/backend/logging/logging-runtime.js';
import { PrettyConsoleBackend } from '@features/runtime/backend/logging/PrettyConsoleBackend.js';
import { mockDeep } from 'vitest-mock-extended';
import { createApiTestRouter } from '@features/index/backend/api.test-fixture.js';
import { createNotesRouter } from '@features/notes/backend/api.router.js';
import type { LogBackend } from '@features/runtime/backend/logging/LogBackend.js';

function injectionToken(value: unknown): InjectionToken {
	if (typeof value === 'string' || typeof value === 'symbol' || typeof value === 'function') return value;
	throw new Error('Expected a Nest constructor injection token');
}

/** Construct the actual transport with ordinary providers; no database is needed for the failed operation. */
async function createService() {
	const tokens = v.parse(v.array(v.unknown()), Reflect.getMetadata('design:paramtypes', OrpcPilotService)).map(injectionToken);
	const explicit = v.parse(v.array(v.object({ index: v.number(), param: v.unknown() })), Reflect.getMetadata('self:paramtypes', OrpcPilotService) ?? []);
	for (const parameter of explicit) tokens[parameter.index] = injectionToken(parameter.param);
	const telemetryService = {
		startSpan: vi.fn((_name: string, callback: () => unknown) => callback()),
		captureMessage: vi.fn((_message: string, _details: { level: string; extra: Record<string, unknown> }) => undefined),
	};
	const notes = mockDeep<Parameters<typeof createNotesRouter>[0]>();
	const failedOperation = notes.getterService.getNoteWithRelations;
	failedOperation.mockRejectedValue(new TypeError('broken endpoint'));
	const router = createApiTestRouter({ notes: createNotesRouter(notes) });
	const lookup = { get: () => ({ compose: () => router }) };
	const providers: Provider[] = [...new Set(tokens)].map(token => ({
		provide: token,
		useValue: token === ModuleRef ? lookup
		: token === DI.config ? { maxFileSize: 1024, enableIpRateLimit: false }
		: token === DI.meta ? { enableServerMachineStats: false }
		: typeof token === 'function' && token.name === 'AuthenticateService' ? { authenticate: async () => [null, null] }
		: typeof token === 'function' && token.name === 'ApiLoggerService' ? { logger: new Logger('api') }
		: typeof token === 'function' && token.name === 'TelemetryService' ? telemetryService
		: {},
	}));
	const nest = await Test.createTestingModule({ providers: [...providers, OrpcPilotService] }).compile();
	const app = Fastify();
	await app.register(async api => nest.get(OrpcPilotService).register(api), { prefix: '/api' });
	return { app, nest, telemetryService, failedOperation };
}

describe('native transport structured error logging', () => {
	test('redacts API credentials and serializes the operation error', async () => {
		const write = vi.fn<LogBackend['write']>();
		logManager.setBackend({ write });
		const previousQuiet = envOption.quiet;
		envOption.quiet = false;
		const h = await createService();
		try {
			const response = await h.app.inject({ method: 'POST', url: '/api/notes/show', payload: {
				noteId: 'note123', i: 'native-token', password: 'password', options: { visible: true },
			} });
			expect(response.statusCode).toBe(500);
			expect(h.failedOperation).toHaveBeenCalledWith('note123');
			const record = write.mock.calls[0][0];
			expect(record).toMatchObject({
				eventName: 'api.endpoint.failed',
				attributes: {
					'api.endpoint': 'notes/show',
					'api.params': { noteId: 'note123', i: '[REDACTED]', password: '[REDACTED]', options: { visible: true } },
				},
				error: { type: 'TypeError', message: 'broken endpoint' },
			});
			expect(record.attributes?.['error.id']).toEqual(expect.any(String));
			expect(h.telemetryService.captureMessage.mock.calls[0][1].extra).not.toHaveProperty('ps');
		} finally {
			await h.app.close();
			await h.nest.close();
			envOption.quiet = previousQuiet;
			logManager.setBackend(new PrettyConsoleBackend({ output: () => undefined }));
		}
	});
});
