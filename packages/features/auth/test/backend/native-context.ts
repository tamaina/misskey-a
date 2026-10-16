/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { ApiContext, ApiToken } from '../../../api/backend/transport/context.js';
import type { MiLocalUser } from '../../../users/backend/models/User.js';
export function testContext(principal: MiLocalUser | null, token: ApiToken | null = null): ApiContext<MiLocalUser> {
	return {
		credential: principal === null ? null : 'fixture', ip: '127.0.0.1', headers: {},
		services: { authenticate: async () => [principal, token], limitActor: actor => actor?.id ?? null, rateLimitFactor: async () => 1, limit: async () => null },
		authorization: { rootUserId: () => principal?.id ?? null, roles: async () => [], policyAllowed: async () => true },
	};
}
