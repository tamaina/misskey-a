/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../../../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../../../../api/backend/transport/context.js';
import { announcementsContract } from '../../../api.contract.js';
import type { AnnouncementsDependencies } from '../../../api.dependencies.js';
import { apiError } from '../../../../../api/backend/transport/orpc-error.js';
export interface AnnouncementDeleteDependencies<Actor extends ApiActor> {
	announcementsRepository: Pick<AnnouncementsDependencies<Actor>['announcementsRepository'], 'findOneBy'>;
	announcementService: Pick<AnnouncementsDependencies<Actor>['announcementService'], 'delete'>;
}
export function createAnnouncementDeleteProcedure<Actor extends ApiActor>(deps: AnnouncementDeleteDependencies<Actor>) {
	return implement(announcementsContract.delete, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: announcementsContract.delete['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'write:admin:announcements' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const row = await deps.announcementsRepository.findOneBy({ id: input.id });
			if (row === null) throw apiError({ code: 'NO_SUCH_ANNOUNCEMENT', message: 'No such announcement.', id: 'ecad8040-a276-4e85-bda9-015a708d291e' });
			await deps.announcementService.delete(row, actor);
		});
}
