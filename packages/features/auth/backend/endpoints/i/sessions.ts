/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type { GlobalEventService } from '@features/runtime/backend/services/GlobalEventService.js';
import type { BrowserSessionService } from '../../services/BrowserSessionService.js';
import { ISessionsContract, ISessionsRevokeContract, ISignoutContract } from '../../api.definition.js';

export interface BrowserSessionDependencies {
	browserSessionService: Pick<BrowserSessionService, 'listOwned' | 'revokeOwned'>;
	globalEventService: Pick<GlobalEventService, 'publishInternalEvent'>;
}

export function createISessionsProcedure(deps: BrowserSessionDependencies) {
	return createApiProcedure<MiLocalUser>()(ISessionsContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		const sessions = await deps.browserSessionService.listOwned(context.principal.id, input.limit, input.offset);
		return sessions.map(session => ({
			id: session.id, createdAt: session.createdAt.toISOString(), lastUsedAt: session.lastUsedAt.toISOString(),
			revokedAt: session.revokedAt?.toISOString() ?? null, current: session.id === context.browserSession?.id,
		}));
	});
}

export function createISessionsRevokeProcedure(deps: BrowserSessionDependencies) {
	return createApiProcedure<MiLocalUser>()(ISessionsRevokeContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ input, context }) => {
		if (await deps.browserSessionService.revokeOwned(context.principal.id, input.sessionId)) {
			deps.globalEventService.publishInternalEvent('browserSessionRevoked', { id: input.sessionId, userId: context.principal.id });
		}
	});
}

export function createISignoutProcedure(deps: BrowserSessionDependencies) {
	return createApiProcedure<MiLocalUser>()(ISignoutContract).use(requirePrincipal<MiLocalUser>()).handler(async ({ context }) => {
		const session = context.browserSession;
		if (!session || session.userId !== context.principal.id) throw apiError({
			code: 'SESSION_NOT_REVOCABLE', message: 'This login cannot be individually revoked on the server.',
			id: '9c48011e-e3d4-4c84-a3e9-40291b7710be', status: 400,
		});
		await deps.browserSessionService.revokeOwned(context.principal.id, session.id);
		context.response?.header('Set-Cookie', 'token=; Path=/; Max-Age=0; SameSite=Lax');
		deps.globalEventService.publishInternalEvent('browserSessionRevoked', { id: session.id, userId: context.principal.id });
	});
}
