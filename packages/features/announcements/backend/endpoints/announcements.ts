/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedAnnouncement } from '../api.dto.js';

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import type { ApiActor } from '@features/api/backend/transport/context.js';
import { announcementsContract } from '../api.definition.js';
import type { AnnouncementsDependencies } from '../api.implementation.js';
import { Brackets } from 'typeorm';
export interface AnnouncementsListDependencies<Actor extends ApiActor> {
	announcementsRepository: Pick<AnnouncementsDependencies<Actor>['announcementsRepository'], 'createQueryBuilder'>;
	queryService: AnnouncementsDependencies<Actor>['queryService'];
	announcementEntityService: AnnouncementsDependencies<Actor>['announcementEntityService'];
}
export function createAnnouncementsListProcedure<Actor extends ApiActor>(deps: AnnouncementsListDependencies<Actor>) {
	return createApiProcedure<Actor>()(announcementsContract.list)
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const query = deps.queryService.makePaginationQuery(deps.announcementsRepository.createQueryBuilder('announcement'), input.sinceId, input.untilId, input.sinceDate, input.untilDate)
				.andWhere('announcement.isActive = :isActive', { isActive: input.isActive })
				.andWhere(new Brackets(qb => {
					if (actor) qb.orWhere('announcement.userId = :meId', { meId: actor.id });
					qb.orWhere('announcement.userId IS NULL');
				}));
			return (await deps.announcementEntityService.packMany(await query.limit(input.limit).getMany(), actor)).map(toPackedAnnouncement);
		});
}
