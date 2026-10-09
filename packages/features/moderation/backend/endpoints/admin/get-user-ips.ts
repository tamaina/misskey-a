/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { moderationContract } from '../../api.definition.js';
import type { ModerationApiDependencies } from '../../api.implementation.js';
export function createAdminGetUserIpsProcedure<Actor extends ApiActor>(deps: Pick<ModerationApiDependencies<Actor>, 'userIpsRepository'>) {
	return implement(moderationContract.adminGetUserIps, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().use(authentication<Actor>()).use(apiPolicy<Actor>({ name: 'admin/get-user-ips', requireCredential: true, requireAdmin: true, kind: 'read:admin:user-ips' })).use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			const ips = await deps.userIpsRepository.find({
				where: { userId: ps.userId },
				order: { id: 'DESC' },
				take: 30,
			});
			return ips.map(x => ({
				ip: x.ip,
				createdAt: x.createdAt.toISOString(),
			}));
		});
}
