/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import * as v from 'valibot';
import { NotePiningService } from '../../services/NotePiningService.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { readErrorId } from '../../request.schema.js';
import { toPackedUserDetailed } from '../../../../users/backend/user.schema.js';
import { iUnpinContract, iUnpinPolicy, iUnpinErrors } from './unpin.contract.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface IUnpinDependencies {
	userEntityService: Pick<UserEntityService, 'packSelf'>;
	notePiningService: Pick<NotePiningService, 'removePinned'>;
}
export function createIUnpinProcedure(deps: IUnpinDependencies) {
	return implement(iUnpinContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(iUnpinPolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			return v.parse(requiredSchema(iUnpinContract['~orpc'].outputSchema), toPackedUserDetailed(await (async () => {
				await deps.notePiningService.removePinned(me, ps.noteId).catch((err: unknown) => {
					if (readErrorId(err) === 'b302d4cf-c050-400a-bbb3-be208681f40c') throw apiError(iUnpinErrors.noSuchNote);
					throw err;
				});

				return await deps.userEntityService.packSelf(me.id);
			})()));
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
