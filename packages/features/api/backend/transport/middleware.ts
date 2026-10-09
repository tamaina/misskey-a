/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { os } from '@orpc/server';
import type { ApiActor, ApiContext, ApiToken, RateLimit } from './context.js';
import { apiError, internalError } from './orpc-error.js';

export function authentication<Actor extends ApiActor>() {
	return os.$context<ApiContext<Actor>>().middleware(async ({ context, next }) => {
		const [principal, token] = await context.services.authenticate(context.credential);
		return next({ context: { principal, token } });
	});
}

export interface AuthenticatedContext<Actor extends ApiActor> extends ApiContext<Actor> {
	principal: Actor | null;
	token: ApiToken | null;
}

export interface ApiPolicy {
	name: string;
	secure?: boolean;
	requireCredential?: boolean;
	requireModerator?: boolean;
	requireAdmin?: boolean;
	prohibitMoved?: boolean;
	requiredRolePolicy?: string;
	kind?: string;
	limit?: Omit<RateLimit, 'key'> & { key?: string };
}

/** Preserve the existing secure, rate, credential, role, then token-scope ordering. */
export function apiPolicy<Actor extends ApiActor>(policy: ApiPolicy) {
	return os.$context<AuthenticatedContext<Actor>>().middleware(async ({ context, next }) => {
		const { principal, token, services } = context;
		if (policy.secure && (principal === null || token !== null)) throw apiError({
			code: 'ACCESS_DENIED', message: 'Access denied.', id: '56f35758-7dd5-468b-8439-5d6fb8ec9b8e',
		});
		if (policy.limit) {
			const actor = services.limitActor(principal, context.ip);
			const factor = principal ? await services.rateLimitFactor(principal) : 1;
			if (actor !== null && factor > 0) {
				const result = await services.limit({ ...policy.limit, key: policy.limit.key ?? policy.name }, actor, factor);
				if (result !== null) throw apiError({
					code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Please try again later.',
					id: 'd5826d14-3982-4d2e-8011-b9e9f02499ef', status: 429,
				}, result.info);
			}
		}
		const requiresPrincipal = policy.requireCredential || policy.requireModerator || policy.requireAdmin;
		if (requiresPrincipal) {
			if (principal === null) throw credentialRequired();
			if (principal.isSuspended) throw apiError({
				code: 'YOUR_ACCOUNT_SUSPENDED', message: 'Your account has been suspended.',
				id: 'a8c724b3-6e9c-4b46-b1a8-bc3ed6258370', kind: 'permission',
			});
		}
		if (policy.prohibitMoved && principal?.movedToUri) throw apiError({
			code: 'YOUR_ACCOUNT_MOVED', message: 'You have moved your account.',
			id: '56f20ec9-fd06-4fa5-841b-edd6d7d4fa31', kind: 'permission',
		});
		if (policy.requireModerator || policy.requireAdmin || policy.requiredRolePolicy !== undefined) {
			if (principal === null) throw credentialRequired();
			const authorization = context.authorization;
			if (!authorization) throw apiError(internalError);
			if (authorization.rootUserId() !== principal.id) {
				const roles = await authorization.roles(principal);
				if (policy.requireModerator && !roles.some(role => role.isModerator || role.isAdministrator)) throw apiError({
					code: 'ROLE_PERMISSION_DENIED', message: 'You are not assigned to a moderator role.',
					id: 'd33d5333-db36-423d-a8f9-1a2b9549da41', kind: 'permission',
				});
				if (policy.requireAdmin && !roles.some(role => role.isAdministrator)) throw apiError({
					code: 'ROLE_PERMISSION_DENIED', message: 'You are not assigned to an administrator role.',
					id: 'c3d38592-54c0-429d-be96-5636b0431a61', kind: 'permission',
				});
				if (policy.requiredRolePolicy !== undefined && !(await authorization.policyAllowed(principal, policy.requiredRolePolicy)) && !roles.some(role => role.isAdministrator)) throw apiError({
					code: 'ROLE_PERMISSION_DENIED', message: 'You are not assigned to a required role.',
					id: '7f86f06f-7e15-4057-8561-f4b6d4ac755a', kind: 'permission',
				});
			}
		}
		if (token && ((policy.kind && !token.permission.includes(policy.kind)) || (!policy.kind && requiresPrincipal))) throw apiError({
			code: 'PERMISSION_DENIED', message: 'Your app does not have the necessary permissions to use this endpoint.',
			id: '1370e5b7-d4eb-4566-bb1d-7748ee6a1838', kind: 'permission',
		});
		return next();
	});
}

function credentialRequired() {
	return apiError({ code: 'CREDENTIAL_REQUIRED', message: 'Credential required.',
		id: '1384574d-a912-4b81-8601-c7b1c4085df1', status: 401 });
}

/** Explicit runtime proof keeps handlers' authenticated principal type honest. */
export function requirePrincipal<Actor extends ApiActor>() {
	return os.$context<AuthenticatedContext<Actor>>().middleware(({ context, next }) => {
		if (context.principal === null) throw credentialRequired();
		return next({ context: { principal: context.principal } });
	});
}

/** Decode only declared primitive query/multipart fields, after authorization. */
export function decodeScalarInput<Actor extends ApiActor>(fields: Readonly<Record<string, 'number' | 'integer' | 'boolean'>>) {
	return os.$context<AuthenticatedContext<Actor>>().middleware(({ next }, input) => {
		if (!isInputRecord(input)) return next();
		for (const [key, type] of Object.entries(fields)) {
			if (typeof input[key] !== 'string') continue;
			try { input[key] = JSON.parse(input[key]); } catch {
				throw apiError({ code: 'INVALID_PARAM', message: 'Invalid param.', id: '0b5f1631-7c1a-41a6-b399-cce335f34d85' },
					{ param: key, reason: `cannot cast to ${type}` });
			}
		}
		return next();
	});
}

function isInputRecord(input: unknown): input is Record<string, unknown> {
	return input !== null && typeof input === 'object' && !Array.isArray(input);
}
