/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { announcementsContract } from '../../../api.definition.js';
import type { AnnouncementsDependencies } from '../../../api.implementation.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
export interface AnnouncementDeleteDependencies<Actor extends ApiActor> {
	announcementsRepository: Pick<AnnouncementsDependencies<Actor>['announcementsRepository'], 'findOneBy'>;
	announcementService: Pick<AnnouncementsDependencies<Actor>['announcementService'], 'delete'>;
}
export function createAnnouncementDeleteProcedure<Actor extends ApiActor>(deps: AnnouncementDeleteDependencies<Actor>) {
	return createApiProcedure<Actor>()(announcementsContract.delete)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const row = await deps.announcementsRepository.findOneBy({ id: input.id });
			if (row === null) throw apiError({ code: 'NO_SUCH_ANNOUNCEMENT', message: 'No such announcement.', id: 'ecad8040-a276-4e85-bda9-015a708d291e' });
			await deps.announcementService.delete(row, actor);
		});
}
