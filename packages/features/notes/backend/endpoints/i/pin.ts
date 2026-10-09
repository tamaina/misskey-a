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
import { iPinContract, iPinPolicy, iPinErrors } from './pin.contract.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface IPinDependencies {
	userEntityService: Pick<UserEntityService, 'packSelf'>;
	notePiningService: Pick<NotePiningService, 'addPinned'>;
}
export function createIPinProcedure(deps: IPinDependencies) {
	return implement(iPinContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(iPinPolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			return v.parse(requiredSchema(iPinContract['~orpc'].outputSchema), toPackedUserDetailed(await (async () => {
				await deps.notePiningService.addPinned(me, ps.noteId).catch((err: unknown) => {
					if (readErrorId(err) === '70c4e51f-5bea-449c-a030-53bee3cce202') throw apiError(iPinErrors.noSuchNote);
					if (readErrorId(err) === '15a018eb-58e5-4da1-93be-330fcc5e4e1a') throw apiError(iPinErrors.pinLimitExceeded);
					if (readErrorId(err) === '23f0cf4e-59a3-4276-a91d-61a5891c1514') throw apiError(iPinErrors.alreadyPinned);
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
