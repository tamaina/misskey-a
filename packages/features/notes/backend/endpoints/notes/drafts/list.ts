/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import * as v from 'valibot';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import { QueryService } from '../../../services/QueryService.js';
import { NoteDraftEntityService } from '../../../serializers/NoteDraftEntityService.js';
import { notesDraftsListContract, notesDraftsListPolicy } from './list.contract.js';
import type { MiNoteDraft, NoteDraftsRepository } from '@features/persistence/backend/repositories/models.js';
import type { MiLocalUser } from '../../../../../users/backend/models/User.js';
import type { ApiContext } from '@features/api/backend/transport/context.js';
export interface NotesDraftsListDependencies {
	noteDraftsRepository: NoteDraftsRepository;
	queryService: Pick<QueryService, 'makePaginationQuery'>;
	noteDraftEntityService: Pick<NoteDraftEntityService, 'packMany'>;
}
export function createNotesDraftsListProcedure(deps: NotesDraftsListDependencies) {
	return implement(notesDraftsListContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<MiLocalUser>>()
		.use(authentication<MiLocalUser>())
		.use(apiPolicy<MiLocalUser>(notesDraftsListPolicy))
		.use(requirePrincipal<MiLocalUser>())
		.handler(async ({ input, context }) => {
			const ps = input;
			const me = context.principal;
			return v.parse(requiredSchema(notesDraftsListContract['~orpc'].outputSchema), await (async () => {
				const query = deps.queryService.makePaginationQuery<MiNoteDraft>(deps.noteDraftsRepository.createQueryBuilder('drafts'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
					.andWhere('drafts.userId = :meId', { meId: me.id });

				if (ps.scheduled === true) {
					query.andWhere('drafts.isActuallyScheduled = true');
				} else if (ps.scheduled === false) {
					query.andWhere('drafts.isActuallyScheduled = false');
				}

				const drafts = await query
					.limit(ps.limit)
					.getMany();

				return await deps.noteDraftEntityService.packMany(drafts, me);
			})());
		});
}

function requiredSchema<Schema>(schema: Schema | undefined): Schema {
	if (schema === undefined) throw new Error('Missing endpoint contract schema');
	return schema;
}
