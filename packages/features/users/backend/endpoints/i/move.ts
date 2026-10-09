/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';

import { apiError } from '@features/api/backend/transport/orpc-error.js';

import { RemoteUserResolveService } from '@features/federation/backend/services/RemoteUserResolveService.js';
import { ApiLoggerService } from '@features/api/backend/transport/ApiLoggerService.js';
import { GetterService } from '@features/api/backend/transport/GetterService.js';
import { ApPersonService } from '@features/federation/backend/services/ApPersonService.js';

import * as Acct from '@features/federation/backend/utility/acct.js';
import { MiMeta } from '@features/persistence/backend/repositories/models.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '../../serializers/UserEntityService.js';
import { AccountMoveService } from '../../services/AccountMoveService.js';
import { MiLocalUser } from '../../models/User.js';
import { iMoveErrors } from './move.contract.js';
import type { UsersInputs } from '../../api.contract.js';
import type { ApiToken } from '@features/api/backend/transport/context.js';

@Injectable()
export class IMoveOperation {
	constructor(
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		private remoteUserResolveService: RemoteUserResolveService,
		private apiLoggerService: ApiLoggerService,
		private accountMoveService: AccountMoveService,
		private getterService: GetterService,
		private apPersonService: ApPersonService,
		private userEntityService: UserEntityService,
	) {
	}

	async execute(ps: UsersInputs['i/move'], me: MiLocalUser, _token: ApiToken | null, _ip: string) {
		// check parameter
		if (!ps.moveToAccount) throw apiError(iMoveErrors.noSuchUser);
		// abort if user is the root
		if (this.serverSettings.rootUserId === me.id) throw apiError(iMoveErrors.rootForbidden);
		// abort if user has already moved
		if (me.movedToUri) throw apiError(iMoveErrors.alreadyMoved);

		// parse user's input into the destination account
		const { username, host } = Acct.parse(ps.moveToAccount);
		// retrieve the destination account
		let moveTo = await this.remoteUserResolveService.resolveUser(username, host).catch((e) => {
			this.apiLoggerService.logger.warn(`failed to resolve remote user: ${e}`);
			throw apiError(iMoveErrors.noSuchUser);
		});
		const destination = await this.getterService.getUser(moveTo.id);
		const newUri = this.userEntityService.getUserUri(destination);

		// update local db
		await this.apPersonService.updatePerson(newUri);
		// retrieve updated user
		moveTo = await this.apPersonService.resolvePerson(newUri);

		// make sure that the user has indicated the old account as an alias
		const fromUrl = this.userEntityService.genLocalUserUri(me.id);
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

		return await this.accountMoveService.moveFromLocal(me, moveTo);
	}
}
