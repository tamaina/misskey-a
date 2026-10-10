/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ORPCError } from '@orpc/server';
import { ApiRouterProvider } from '@features/index/backend/api.implementation.js';
import { pilotContract } from '@features/index/backend/api.definition.js';
import { ApiExecutionContextFactory } from '@features/api/backend/transport/ApiExecutionContextFactory.js';
import { createAllowedApiCaller, McpSelectionError } from './api-caller.js';
import type { ApiRequestContext } from '@features/api/backend/transport/ApiExecutionContextFactory.js';

/** Application seam only. No HTTP registration or credential/grant issuance. */
@Injectable()
export class McpApiService {
	private caller: ReturnType<typeof createAllowedApiCaller> | undefined;
	constructor(private readonly contexts: ApiExecutionContextFactory, private readonly moduleRef: ModuleRef) { }

	async prepare(request: ApiRequestContext, signal?: AbortSignal) {
		signal?.throwIfAborted();
		const context = this.contexts.create({ ...request, safeDiagnostics: true }, 'users/notes');
		const authenticated = await context.services.authenticate(context.credential).catch(error => { throw context.mapError ? context.mapError(error) : error; });
		const [principal] = authenticated;
		if (principal === null) throw new McpSelectionError('SUBJECT_REQUIRED');
		const bound = { ...context, services: { ...context.services, authenticate: async () => authenticated } };
		return { invoke: async (tool: string, input: unknown, invocationSignal?: AbortSignal): Promise<unknown> => {
			validateSelection(tool, input);
			if ('userId' in input && input.userId !== principal.id) throw new McpSelectionError('SUBJECT_MISMATCH');
			const caller = this.caller ??= createAllowedApiCaller(this.moduleRef.get(ApiRouterProvider, { strict: false }).compose(), pilotContract, ['users/notes']);
			return caller('users/notes', { ...input, userId: principal.id }, bound, invocationSignal);
		} };
	}

	async invoke(tool: string, input: unknown, request: ApiRequestContext, signal?: AbortSignal): Promise<unknown> {
		validateSelection(tool, input);
		return (await this.prepare(request, signal)).invoke(tool, input, signal);
	}
}

function validateSelection(tool: string, input: unknown): asserts input is Record<string, unknown> {
	if (tool !== 'list_my_notes') throw new McpSelectionError('TOOL_UNAVAILABLE');
	if (input === null || typeof input !== 'object' || Array.isArray(input)
		|| (Object.getPrototypeOf(input) !== Object.prototype && Object.getPrototypeOf(input) !== null)) {
		throw new ORPCError('BAD_REQUEST', { message: 'Expected an argument object' });
	}
}
