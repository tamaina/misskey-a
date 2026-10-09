/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import type { ApiContext } from '../../../../api/backend/transport/context.js';
import { reversiMatchContract, reversiMatchErrors } from './match.contract.js';
import type { ReversiService } from '../../services/ReversiService.js';
import type { ReversiGameEntityService } from '../../serializers/ReversiGameEntityService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import type { GetterService } from '@features/api/backend/transport/GetterService.js';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
export interface ReversiMatchDependencies {
	getterService: Pick<GetterService, 'getUser'>;
	reversiService: Pick<ReversiService, 'matchAnyUser' | 'matchSpecificUser'>;
	reversiGameEntityService: Pick<ReversiGameEntityService, 'packDetail'>;
}
export function createReversiMatchProcedure(deps: ReversiMatchDependencies) {
	return implement(reversiMatchContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>({ name: reversiMatchContract['~orpc'].meta.requestName, requireCredential: true, kind: 'write:account' }))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input: ps, context }) => {
			const me = context.principal;
			if (ps.userId === me.id) throw apiError(reversiMatchErrors.isYourself);
			const target = ps.userId ? await deps.getterService.getUser(ps.userId).catch((err: unknown) => {
				if (err !== null && typeof err === 'object' && 'id' in err && err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw apiError(reversiMatchErrors.noSuchUser);
				throw err;
			}) : null;
			const game = target
				? await deps.reversiService.matchSpecificUser(me, target, ps.multiple)
				: await deps.reversiService.matchAnyUser(me, { noIrregularRules: ps.noIrregularRules }, ps.multiple);
			if (game == null) return;
			return await deps.reversiGameEntityService.packDetail(game);
		});
}
