/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import { reversiInvitationsContract } from './invitations.contract.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { ReversiService } from '../../services/ReversiService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface ReversiInvitationsDependencies {
	userEntityService: Pick<UserEntityService, 'packMany'>;
	reversiService: Pick<ReversiService, 'getInvitations'>;
}
export function createReversiInvitationsProcedure(deps: ReversiInvitationsDependencies) {
	return implement(reversiInvitationsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: reversiInvitationsContract['~orpc'].meta.requestName, requireCredential: true, kind: 'read:account' }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ context }) => {
			const me = context.principal;
			const invitations = await deps.reversiService.getInvitations(me);
			return await deps.userEntityService.packMany(invitations, me);
		});
}
