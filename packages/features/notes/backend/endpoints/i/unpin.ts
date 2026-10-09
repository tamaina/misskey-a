/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { Injectable } from '@nestjs/common';
import { UserEntityService } from '@features/users/backend/serializers/UserEntityService.js';
import * as v from 'valibot';
import { NotePiningService } from '../../services/NotePiningService.js';
import { authentication, apiPolicy, requirePrincipal } from '../../../../api/backend/transport/middleware.js';
import { apiError } from '../../../../api/backend/transport/orpc-error.js';
import { readErrorId } from '../../request.schema.js';
import { toPackedUserDetailed } from '../../../../users/backend/user.schema.js';
import { iUnpinContract, iUnpinPolicy, iUnpinInput, iUnpinOutput, iUnpinErrors } from './unpin.contract.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { NotesApiContext } from '../../operations.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';

export function createIUnpinProcedure<Actor extends ApiActor>() {
	return implement(iUnpinContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotesApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(iUnpinPolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.notes.iUnpin(input, context.principal));
}

@Injectable()
export class IUnpinOperation {
	constructor(
		private userEntityService: UserEntityService,
		private notePiningService: NotePiningService,
	) {}
	async execute(ps: v.InferOutput<typeof iUnpinInput>, me: MiLocalUser): Promise<v.InferOutput<typeof iUnpinOutput>> {
		return v.parse(iUnpinOutput, toPackedUserDetailed(await this.run(ps, me)));
	}

	private async run(ps: v.InferOutput<typeof iUnpinInput>, me: MiLocalUser) {
		await this.notePiningService.removePinned(me, ps.noteId).catch((err: unknown) => {
			if (readErrorId(err) === 'b302d4cf-c050-400a-bbb3-be208681f40c') throw apiError(iUnpinErrors.noSuchNote);
			throw err;
		});

		return await this.userEntityService.packSelf(me.id);
	}
}
