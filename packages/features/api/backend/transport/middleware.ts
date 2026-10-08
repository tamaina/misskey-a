/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { os } from '@orpc/server';
import type { ApiActor, ApiContext, ApiToken, RateLimit } from './context.js';
import { apiError } from './orpc-error.js';

export function authentication<Actor extends ApiActor>() {
	return os.$context<ApiContext<Actor>>().middleware(async ({ context, next }) => {
		const [principal, token] = await context.services.authenticate(context.credential);
		return next({ context: { principal, token } });
	});
}

interface AuthenticatedContext<Actor extends ApiActor> extends ApiContext<Actor> {
	principal: Actor | null;
	token: ApiToken | null;
}

/** Rate limits intentionally precede credential and permission failures. */
export function writePolicy<Actor extends ApiActor>(scope: string, limit: RateLimit, prohibitMoved = false) {
	return os.$context<AuthenticatedContext<Actor>>().middleware(async ({ context, next }) => {
		const { principal, token, services } = context;
		const limitActor = services.limitActor(principal, context.ip);
		const factor = principal ? await services.rateLimitFactor(principal) : 1;
		if (limitActor !== null && factor > 0) {
			const result = await services.limit(limit, limitActor, factor);
			if (result !== null) throw apiError({
				code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Please try again later.',
				id: 'd5826d14-3982-4d2e-8011-b9e9f02499ef', status: 429,
			}, result.info);
		}
		if (principal === null) throw apiError({
			code: 'CREDENTIAL_REQUIRED', message: 'Credential required.',
			id: '1384574d-a912-4b81-8601-c7b1c4085df1', status: 401,
		});
		if (principal.isSuspended) throw apiError({
			code: 'YOUR_ACCOUNT_SUSPENDED', message: 'Your account has been suspended.',
			id: 'a8c724b3-6e9c-4b46-b1a8-bc3ed6258370', kind: 'permission',
		});
		if (prohibitMoved && principal.movedToUri) throw apiError({
			code: 'YOUR_ACCOUNT_MOVED', message: 'You have moved your account.',
			id: '56f20ec9-fd06-4fa5-841b-edd6d7d4fa31', kind: 'permission',
		});
		if (token && !token.permission.includes(scope)) throw apiError({
			code: 'PERMISSION_DENIED',
			message: 'Your app does not have the necessary permissions to use this endpoint.',
			id: '1370e5b7-d4eb-4566-bb1d-7748ee6a1838', kind: 'permission',
		});
		return next({ context: { principal } });
	});
}
