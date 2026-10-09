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
import { iPinContract, iPinPolicy, iPinInput, iPinOutput, iPinErrors } from './pin.contract.js';
import type { MiLocalUser } from '../../../../users/backend/models/User.js';
import type { NotesApiContext } from '../../operations.js';
import type { ApiActor } from '../../../../api/backend/transport/context.js';

export function createIPinProcedure<Actor extends ApiActor>() {
	return implement(iPinContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<NotesApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>(iPinPolicy))
		.use(requirePrincipal<Actor>())
		.handler(({ input, context }) => context.operations.notes.iPin(input, context.principal));
}

@Injectable()
export class IPinOperation {
	constructor(
		private userEntityService: UserEntityService,
		private notePiningService: NotePiningService,
	) {}
	async execute(ps: v.InferOutput<typeof iPinInput>, me: MiLocalUser): Promise<v.InferOutput<typeof iPinOutput>> {
		return v.parse(iPinOutput, toPackedUserDetailed(await this.run(ps, me)));
	}

	private async run(ps: v.InferOutput<typeof iPinInput>, me: MiLocalUser) {
		await this.notePiningService.addPinned(me, ps.noteId).catch((err: unknown) => {
			if (readErrorId(err) === '70c4e51f-5bea-449c-a030-53bee3cce202') throw apiError(iPinErrors.noSuchNote);
			if (readErrorId(err) === '15a018eb-58e5-4da1-93be-330fcc5e4e1a') throw apiError(iPinErrors.pinLimitExceeded);
			if (readErrorId(err) === '23f0cf4e-59a3-4276-a91d-61a5891c1514') throw apiError(iPinErrors.alreadyPinned);
			throw err;
		});

		return await this.userEntityService.packSelf(me.id);
	}
}
