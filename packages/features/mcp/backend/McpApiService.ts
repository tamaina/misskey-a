/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { isContractProcedure } from '@orpc/contract';
import * as v from 'valibot';
import { availableEndpointsResult } from '@features/instance/backend/endpoints/available-endpoints.contract.js';
import { mcpScopes } from './discovery.js';
import { McpEventsService } from './McpEventsService.js';
import { ORPCError } from '@orpc/server';
import { ApiRouterProvider } from '@features/index/backend/api.implementation.js';
import { endpointPolicies } from '@features/api/backend/transport/endpoint-directory.js';
import { pilotContract } from '@features/index/backend/api.definition.js';
import { ApiExecutionContextFactory } from '@features/api/backend/transport/ApiExecutionContextFactory.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { DI } from '@/di-symbols.js';
import { createAllowedApiCaller, McpSelectionError } from './api-caller.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
import type { AccessTokensRepository, AppsRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { ApiRequestContext } from '@features/api/backend/transport/ApiExecutionContextFactory.js';

/** Request names whose contract route carries the non-productive tag. HTTP behavior is unchanged. */
function nonProductiveEndpointNames(contract: unknown): ReadonlySet<string> {
	const names = new Set<string>();
	const visit = (node: unknown): void => {
		if (isContractProcedure(node)) {
			const { meta, route } = node['~orpc'];
			const name: unknown = meta.requestName;
			if (typeof name === 'string' && Array.isArray(route.tags) && route.tags.includes('non-productive')) names.add(name);
			return;
		}
		if (node !== null && typeof node === 'object' && !Array.isArray(node)) {
			for (const child of Object.values(node)) visit(child);
		}
	};
	visit(contract);
	return names;
}

const nonProductiveEndpoints = nonProductiveEndpointNames(pilotContract);

/** Application seam only. No HTTP registration or credential/grant issuance. */
@Injectable()
export class McpApiService {
	private readonly endpoints = endpointPolicies(pilotContract).filter(endpoint => endpoint.mcpSupported && !nonProductiveEndpoints.has(endpoint.name));
	private genericCaller: ReturnType<typeof createAllowedApiCaller> | undefined;
	private caller: ReturnType<typeof createAllowedApiCaller> | undefined;
	constructor(private readonly contexts: ApiExecutionContextFactory, private readonly moduleRef: ModuleRef,
		@Inject(DI.accessTokensRepository) private readonly tokens: AccessTokensRepository,
		@Inject(DI.appsRepository) private readonly apps: AppsRepository,
		@Inject(DI.usersRepository) private readonly users: UsersRepository,
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
		return { events: async (method: string, input: unknown, invocationSignal?: AbortSignal) => {
			const { actor, permission } = await this.checkAccess(principal.id, tokenId);
			const operationContext = this.contexts.create({ ...request, safeDiagnostics: true, freshAuthorization: true }, `mcp/${method}`);
			const bound: ApiContext<MiLocalUser> = { ...operationContext, services: { ...operationContext.services, authenticate: async () => [actor, { ...token, permission }] } };
			return this.moduleRef.get(McpEventsService, { strict: false }).invoke(method, input, bound, invocationSignal);
		}, invoke: async (tool: string, input: unknown, invocationSignal?: AbortSignal): Promise<unknown> => {
			validateSelection(tool, input);
			const { actor, permission } = await this.checkAccess(principal.id, tokenId);
			const endpointName = tool === 'call_api' && typeof input.endpoint === 'string' ? input.endpoint : tool === 'list_api_endpoints' ? 'available-endpoints' : 'users/notes';
			const operationContext = this.contexts.create({ ...request, safeDiagnostics: true, freshAuthorization: true }, endpointName);
			const bound: ApiContext = { ...operationContext, services: { ...operationContext.services, authenticate: async () => [actor, { ...token, permission }] } };
			const generic = () => this.genericCaller ??= createAllowedApiCaller(this.moduleRef.get(ApiRouterProvider, { strict: false }).compose(), pilotContract, this.endpoints.map(endpoint => endpoint.name));
			if (tool === 'list_api_endpoints') {
				if (Object.keys(input).some(key => key !== 'endpoint')) throw new ORPCError('BAD_REQUEST', { message: 'Unexpected discovery argument' });
				const directory = v.parse(availableEndpointsResult, await generic()('available-endpoints', input, bound, invocationSignal));
				const supported = new Set(this.endpoints.map(endpoint => endpoint.name));
				return { ...directory, endpoints: directory.endpoints.filter(name => supported.has(name)), definitions: directory.definitions.filter(endpoint => supported.has(endpoint.name)) };
			}
			if (tool === 'call_api') {
				if (typeof input.endpoint !== 'string' || !/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(input.endpoint)) throw new McpSelectionError('TOOL_UNAVAILABLE');
				if (!isInputObject(input.arguments) || 'i' in input.arguments) throw new ORPCError('BAD_REQUEST', { message: 'Expected API arguments without credentials' });
				if (Object.keys(input).some(key => key !== 'endpoint' && key !== 'arguments')) throw new ORPCError('BAD_REQUEST', { message: 'Unexpected invocation argument' });
				return generic()(input.endpoint, input.arguments, bound, invocationSignal);
			}
			if ('userId' in input && input.userId !== principal.id) throw new McpSelectionError('SUBJECT_MISMATCH');
			const caller = this.caller ??= createAllowedApiCaller(this.moduleRef.get(ApiRouterProvider, { strict: false }).compose(), pilotContract, ['users/notes']);
			return caller('users/notes', { ...input, userId: principal.id }, bound, invocationSignal);
		} };
	}

	/** Advertise the native endpoint's additional scope only after a real permission denial. */
	requiredScopes(tool: string, input: unknown): readonly string[] {
		if (tool !== 'call_api' || !isInputObject(input)) return mcpScopes;
		const kind = this.endpoints.find(endpoint => endpoint.name === input.endpoint)?.policy.kind;
		return kind ? [...new Set([...mcpScopes, kind])] : mcpScopes;
	}

	private async checkAccess(userId: string, tokenId: string) {
		// Use shared repositories; do not trust the native app cache for this connection gate.
		const grant = await this.tokens.findOneBy({ id: tokenId, userId });
		const actor = await this.users.findOneBy({ id: userId }) as MiLocalUser | null;
		if (!grant || !actor || actor.host !== null) throw apiError({ code: 'AUTHENTICATION_FAILED', status: 401, message: 'Authentication failed.', id: 'b0a7f5f8-dc2f-4171-b91f-de88ad238e14' });
		const permission = grant.appId ? (await this.apps.findOneBy({ id: grant.appId }))?.permission : grant.permission;
		if (!permission?.includes('access:mcp')) throw mcpPermissionDenied();
		return { actor, permission };
	}

	async invoke(tool: string, input: unknown, request: ApiRequestContext, signal?: AbortSignal): Promise<unknown> {
		validateSelection(tool, input);
		return (await this.prepare(request, signal)).invoke(tool, input, signal);
	}
}

function validateSelection(tool: string, input: unknown): asserts input is Record<string, unknown> {
	if (!['list_my_notes', 'call_api', 'list_api_endpoints'].includes(tool)) throw new McpSelectionError('TOOL_UNAVAILABLE');
	if (!isInputObject(input)) throw new ORPCError('BAD_REQUEST', { message: 'Expected an argument object' });
}

function isInputObject(input: unknown): input is Record<string, unknown> {
	return input !== null && typeof input === 'object' && !Array.isArray(input)
		&& (Object.getPrototypeOf(input) === Object.prototype || Object.getPrototypeOf(input) === null);
}

function mcpPermissionDenied() {
	return apiError({ code: 'PERMISSION_DENIED', kind: 'permission', message: 'A scoped token with access:mcp permission is required.', id: '559aef82-cc17-4ff6-bd0e-05c714be6b42' }, { required: 'access:mcp' });
}
