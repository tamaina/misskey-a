/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomUUID } from 'node:crypto';
import type { EntityManager } from 'typeorm';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { MiAccessToken } from '@features/auth/backend/models/AccessToken.js';
import { MiApp } from '@features/auth/backend/models/App.js';
import { MiUser } from '@features/users/backend/models/User.js';
import type { MiWebhook } from './models/Webhook.js';

/** A missing token ID must never turn a scoped grant into owner authorization. */
export function authorizeLegacyChatWebhook(token: ApiToken | null) {
	if (token && (!token.id || !token.permission.includes('read:chat'))) throw apiError({
		code: 'PERMISSION_DENIED', message: 'Your app does not have the necessary permissions to use this endpoint.',
		id: '1370e5b7-d4eb-4566-bb1d-7748ee6a1838', kind: 'permission',
	});
	return { chatGeneration: randomUUID(), chatTokenId: token?.id ?? null };
}

/** Read live grants, not authentication or webhook caches, on every delivery attempt. */
export async function canDeliverLegacyChatWebhook(manager: EntityManager, webhook: MiWebhook): Promise<boolean> {
	if (!webhook.chatGeneration) return false;
	const user = await manager.getRepository(MiUser).findOneBy({ id: webhook.userId });
	if (!user || user.host !== null || user.isSuspended || user.movedToUri) return false;
	// Native owner authorization and grandfathered beta hooks are not token-bound.
	if (webhook.chatTokenId === null) return true;
	if (!webhook.chatTokenId) return false;
	const token = await manager.getRepository(MiAccessToken).findOneBy({ id: webhook.chatTokenId, userId: webhook.userId });
	if (!token) return false;
	const permission = token.appId
		? (await manager.getRepository(MiApp).findOneBy({ id: token.appId }))?.permission
		: token.permission;
	return permission?.includes('read:chat') === true && permission.includes('write:account');
}
