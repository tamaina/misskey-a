/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { announcementsContract } from '../../../api.definition.js';
import type { AnnouncementsDependencies } from '../../../api.implementation.js';
import type { InferContractRouterOutputs } from '@orpc/contract';
export interface AnnouncementAdminListDependencies<Actor extends ApiActor> {
	announcementsRepository: Pick<AnnouncementsDependencies<Actor>['announcementsRepository'], 'createQueryBuilder'>;
	announcementReadsRepository: AnnouncementsDependencies<Actor>['announcementReadsRepository'];
	queryService: AnnouncementsDependencies<Actor>['queryService'];
	idService: AnnouncementsDependencies<Actor>['idService'];
}
export function createAnnouncementAdminListProcedure<Actor extends ApiActor>(deps: AnnouncementAdminListDependencies<Actor>) {
	return implement(announcementsContract.adminList, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: announcementsContract.adminList['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'read:admin:announcements' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input }) => {
			const query = deps.queryService.makePaginationQuery(deps.announcementsRepository.createQueryBuilder('announcement'), input.sinceId, input.untilId, input.sinceDate, input.untilDate);
			if (input.status === 'archived') query.andWhere('announcement.isActive = false');
			else if (input.status === 'active') query.andWhere('announcement.isActive = true');
			if (input.userId) query.andWhere('announcement.userId = :userId', { userId: input.userId });
			else query.andWhere('announcement.userId IS NULL');
			const rows = await query.limit(input.limit).getMany();
			const result: InferContractRouterOutputs<typeof announcementsContract>['adminList'] = [];
			for (const row of rows) result.push({
				id: row.id, createdAt: deps.idService.parse(row.id).date.toISOString(), updatedAt: row.updatedAt?.toISOString() ?? null,
				title: row.title, text: row.text, imageUrl: row.imageUrl, icon: row.icon, display: row.display,
				isActive: row.isActive, forExistingUsers: row.forExistingUsers, silence: row.silence,
				needConfirmationToRead: row.needConfirmationToRead, userId: row.userId,
				reads: await deps.announcementReadsRepository.countBy({ announcementId: row.id }),
			});
			return result;
		});
}
