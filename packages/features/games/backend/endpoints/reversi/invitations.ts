/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedUserLite } from '@features/users/backend/user.schema.js';
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { reversiInvitationsContract } from './invitations.contract.js';
import type { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import type { ReversiService } from '../../services/ReversiService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface ReversiInvitationsDependencies {
	userEntityService: Pick<UserEntityService, 'packMany'>;
	reversiService: Pick<ReversiService, 'getInvitations'>;
}
export function createReversiInvitationsProcedure(deps: ReversiInvitationsDependencies) {
	return createApiProcedure<MiLocalUser>()(reversiInvitationsContract)
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ context }) => {
			const me = context.principal;
			const invitations = await deps.reversiService.getInvitations(me);
			return (await deps.userEntityService.packMany(invitations, me)).map(toPackedUserLite);
		});
}
