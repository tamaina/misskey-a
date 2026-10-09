/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { announcementsContract } from '../../../api.definition.js';
import type { AnnouncementsDependencies } from '../../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
export interface AnnouncementUpdateDependencies<Actor extends ApiActor> {
	announcementsRepository: Pick<AnnouncementsDependencies<Actor>['announcementsRepository'], 'findOneBy'>;
	announcementService: Pick<AnnouncementsDependencies<Actor>['announcementService'], 'update'>;
}
export function createAnnouncementUpdateProcedure<Actor extends ApiActor>(deps: AnnouncementUpdateDependencies<Actor>) {
	return implement(announcementsContract.update, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: announcementsContract.update['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'write:admin:announcements' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const row = await deps.announcementsRepository.findOneBy({ id: input.id });
			if (row === null) throw apiError({ code: 'NO_SUCH_ANNOUNCEMENT', message: 'No such announcement.', id: 'd3aae5a7-6372-4cb4-b61c-f511ffc2d7cc' });
			await deps.announcementService.update(row, {
				updatedAt: new Date(), title: input.title, text: input.text, imageUrl: input.imageUrl || null,
				display: input.display, icon: input.icon, forExistingUsers: input.forExistingUsers,
				silence: input.silence, needConfirmationToRead: input.needConfirmationToRead, isActive: input.isActive,
			}, actor);
		});
}
