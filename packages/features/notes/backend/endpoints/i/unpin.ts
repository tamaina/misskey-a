/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import { NotePiningService } from '../../services/NotePiningService.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import { apiError } from "@features/api/backend/transport/orpc-error.js";
import { readErrorId } from '../../request.schema.js';
import { toPackedUserDetailed } from "@features/users/backend/user.schema.js";
import { iUnpinContract, iUnpinErrors } from './unpin.contract.js';
import type { MiLocalUser } from "@features/users/backend/models/User.js";

export interface IUnpinDependencies {
	userEntityService: Pick<UserEntityService, 'packSelf'>;
	notePiningService: Pick<NotePiningService, 'removePinned'>;
}
export function createIUnpinProcedure(deps: IUnpinDependencies) {
	return createApiProcedure<MiLocalUser>()(iUnpinContract).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			return toPackedUserDetailed(await (async () => {
				await deps.notePiningService.removePinned(me, ps.noteId).catch((err: unknown) => {
					if (readErrorId(err) === 'b302d4cf-c050-400a-bbb3-be208681f40c') throw apiError(iUnpinErrors.noSuchNote);
					throw err;
				});

				return await deps.userEntityService.packSelf(me.id);
			})());
		});
}
