/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import * as v from 'valibot';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { notesDraftsCountContract, notesDraftsCountPolicy } from './count.contract.js';
import type { NoteDraftsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface NotesDraftsCountDependencies {
	noteDraftsRepository: NoteDraftsRepository;
}
export function createNotesDraftsCountProcedure(deps: NotesDraftsCountDependencies) {
	return implement(notesDraftsCountContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(notesDraftsCountPolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const _ps = input;
			const me = context.principal;
			return v.parse(requiredSchema(notesDraftsCountContract['~orpc'].outputSchema), await (async () => {
				const count = await deps.noteDraftsRepository.createQueryBuilder('drafts')
					.where('drafts.userId = :meId', { meId: me.id })
					.getCount();

				return count;
			})());
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
