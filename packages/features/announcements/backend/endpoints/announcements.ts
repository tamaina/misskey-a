/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../api/backend/transport/context.js';
import { announcementsContract } from '../api.contract.js';
import type { AnnouncementsDependencies } from '../api.dependencies.js';
import { Brackets } from 'typeorm';
export interface AnnouncementsListDependencies<Actor extends ApiActor> {
	announcementsRepository: Pick<AnnouncementsDependencies<Actor>['announcementsRepository'], 'createQueryBuilder'>;
	queryService: AnnouncementsDependencies<Actor>['queryService'];
	announcementEntityService: AnnouncementsDependencies<Actor>['announcementEntityService'];
}
export function createAnnouncementsListProcedure<Actor extends ApiActor>(deps: AnnouncementsListDependencies<Actor>) {
	return implement(announcementsContract.list, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: announcementsContract.list['~orpc'].meta.requestName }))
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.announcementsRepository.createQueryBuilder('announcement'), input.sinceId, input.untilId, input.sinceDate, input.untilDate)
				.andWhere('announcement.isActive = :isActive', { isActive: input.isActive })
				.andWhere(new Brackets(qb => {
					if (actor) qb.orWhere('announcement.userId = :meId', { meId: actor.id });
					qb.orWhere('announcement.userId IS NULL');
				}));
			return deps.announcementEntityService.packMany(await query.limit(input.limit).getMany(), actor);
		});
}
