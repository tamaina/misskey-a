/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy } from '@features/api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { announcementsContract } from '../../api.definition.js';
import type { AnnouncementsDependencies } from '../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { EntityNotFoundError } from 'typeorm';
export interface AnnouncementShowDependencies<Actor extends ApiActor> {
	announcementService: Pick<AnnouncementsDependencies<Actor>['announcementService'], 'getAnnouncement'>;
}
export function createAnnouncementShowProcedure<Actor extends ApiActor>(deps: AnnouncementShowDependencies<Actor>) {
	return implement(announcementsContract.show, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: announcementsContract.show['~orpc'].meta.requestName }))
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			try {
				return await deps.announcementService.getAnnouncement(input.announcementId, actor);
			} catch (error) {
				if (error instanceof EntityNotFoundError) throw apiError({ code: 'NO_SUCH_ANNOUNCEMENT', message: 'No such announcement.', id: 'b57b5e1d-4f49-404a-9edb-46b00268f121' });
				throw error;
			}
		});
}
