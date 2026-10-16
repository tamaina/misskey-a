/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { announcementsContract } from '../../api.definition.js';
import type { AnnouncementsDependencies } from '../../api.implementation.js';
export interface ReadAnnouncementDependencies<Actor extends ApiActor> {
	announcementService: Pick<AnnouncementsDependencies<Actor>['announcementService'], 'read'>;
}
export function createReadAnnouncementProcedure<Actor extends ApiActor>(deps: ReadAnnouncementDependencies<Actor>) {
	return createApiProcedure<Actor>()(announcementsContract.read)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			await deps.announcementService.read(actor, input.announcementId);
		});
}
