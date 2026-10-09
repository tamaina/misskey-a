/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { type RemoteUserResolveService } from '@features/federation/backend/services/RemoteUserResolveService.js';
import { type ApiLoggerService } from '@features/api/backend/transport/ApiLoggerService.js';
import { type GetterService } from '@features/api/backend/transport/GetterService.js';
import { type ApPersonService } from '@features/federation/backend/services/ApPersonService.js';
import * as Acct from '@features/federation/backend/utility/acct.js';
import { type MiMeta } from '@features/persistence/backend/repositories/models.js';
import { type UserEntityService } from '../../serializers/UserEntityService.js';
import { type AccountMoveService } from '../../services/AccountMoveService.js';
import { type MiLocalUser } from '../../models/User.js';
import { iMoveErrors } from './move.contract.js';
import type { UsersInputs } from '../../api.definition.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';
import { iMoveContract } from './move.contract.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';

import { toPackedUserDetailed } from '@features/users/backend/user.schema.js';
export interface IMoveDependencies {
	serverSettings: MiMeta;
	remoteUserResolveService: RemoteUserResolveService;
	apiLoggerService: ApiLoggerService;
	accountMoveService: AccountMoveService;
	getterService: GetterService;
	apPersonService: ApPersonService;
	userEntityService: UserEntityService;
}
export function createIMoveProcedure(deps: IMoveDependencies) {
	async function execute(ps: UsersInputs['i/move'], me: MiLocalUser, _token: ApiToken | null, _ip: string) {
		// check parameter
		if (!ps.moveToAccount) throw apiError(iMoveErrors.noSuchUser);
		// abort if user is the root
		if (deps.serverSettings.rootUserId === me.id) throw apiError(iMoveErrors.rootForbidden);
		// abort if user has already moved
		if (me.movedToUri) throw apiError(iMoveErrors.alreadyMoved);

		// parse user's input into the destination account
		const { username, host } = Acct.parse(ps.moveToAccount);
		// retrieve the destination account
		let moveTo = await deps.remoteUserResolveService.resolveUser(username, host).catch((e) => {
			deps.apiLoggerService.logger.warn(`failed to resolve remote user: ${e}`);
			throw apiError(iMoveErrors.noSuchUser);
		});
		const destination = await deps.getterService.getUser(moveTo.id);
		const newUri = deps.userEntityService.getUserUri(destination);

		// update local db
		await deps.apPersonService.updatePerson(newUri);
		// retrieve updated user
		moveTo = await deps.apPersonService.resolvePerson(newUri);

		// make sure that the user has indicated the old account as an alias
		const fromUrl = deps.userEntityService.genLocalUserUri(me.id);
		let allowed = false;
		if (moveTo.alsoKnownAs) {
			for (const knownAs of moveTo.alsoKnownAs) {
				if (knownAs.includes(fromUrl)) {
					allowed = true;
					break;
				}
			}
		}

		// abort if unintended
		if (!allowed || moveTo.movedToUri) throw apiError(iMoveErrors.destinationAccountForbids);

		return await deps.accountMoveService.moveFromLocal(me, moveTo);
	}

	return createApiProcedure<MiLocalUser>()(iMoveContract).use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => toPackedUserDetailed(await execute(input, context.principal, context.token, context.ip)));
}
