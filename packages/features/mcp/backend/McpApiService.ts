/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ORPCError } from '@orpc/server';
import { ApiRouterProvider } from '@features/index/backend/api.implementation.js';
import { pilotContract } from '@features/index/backend/api.definition.js';
import { ApiExecutionContextFactory } from '@features/api/backend/transport/ApiExecutionContextFactory.js';
import { DI } from '@/di-symbols.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { AccessTokensRepository, AppsRepository } from '@features/persistence/backend/repositories/models.js';
import { createAllowedApiCaller, McpSelectionError } from './api-caller.js';
import type { ApiRequestContext } from '@features/api/backend/transport/ApiExecutionContextFactory.js';

/** Application seam only. No HTTP registration or credential/grant issuance. */
@Injectable()
export class McpApiService {
	private caller: ReturnType<typeof createAllowedApiCaller> | undefined;
	constructor(private readonly contexts: ApiExecutionContextFactory, private readonly moduleRef: ModuleRef,
		@Inject(DI.accessTokensRepository) private readonly tokens: AccessTokensRepository,
		@Inject(DI.appsRepository) private readonly apps: AppsRepository,
	) { }

	async prepare(request: ApiRequestContext, signal?: AbortSignal) {
		signal?.throwIfAborted();
		const context = this.contexts.create({ ...request, safeDiagnostics: true }, 'users/notes');
		const authenticated = await context.services.authenticate(context.credential).catch(error => { throw context.mapError ? context.mapError(error) : error; });
		const [principal, token] = authenticated;
		if (!principal) throw new McpSelectionError('SUBJECT_REQUIRED');
		// Native master/session credentials have no scoped grant and cannot opt into MCP.
		if (!token?.id) throw mcpPermissionDenied();
		const tokenId = token.id;
		await this.checkAccess(principal.id, tokenId);
		const bound = { ...context, services: { ...context.services, authenticate: async () => authenticated } };
		return { invoke: async (tool: string, input: unknown, invocationSignal?: AbortSignal): Promise<unknown> => {
			validateSelection(tool, input);
			await this.checkAccess(principal.id, tokenId);
			if ('userId' in input && input.userId !== principal.id) throw new McpSelectionError('SUBJECT_MISMATCH');
			const caller = this.caller ??= createAllowedApiCaller(this.moduleRef.get(ApiRouterProvider, { strict: false }).compose(), pilotContract, ['users/notes']);
			return caller('users/notes', { ...input, userId: principal.id }, bound, invocationSignal);
		} };
	}

	private async checkAccess(userId: string, tokenId: string): Promise<void> {
		// Use shared repositories; do not trust the native app cache for this connection gate.
		const grant = await this.tokens.findOneBy({ id: tokenId, userId });
		if (!grant) throw apiError({ code: 'AUTHENTICATION_FAILED', status: 401, message: 'Authentication failed.', id: 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14' });
		const permission = grant.appId ? (await this.apps.findOneBy({ id: grant.appId }))?.permission : grant.permission;
		if (!permission?.includes('access:mcp')) throw mcpPermissionDenied();
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

function mcpPermissionDenied() {
	return apiError({ code: 'PERMISSION_DENIED', kind: 'permission', message: 'A scoped token with access:mcp permission is required.', id: '559aef82-cc17-4ff6-bd0e-05c714be6b42' }, { required: 'access:mcp' });
}
