/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { toPackedAnnouncement, toAnnouncementAutoArchiveAt } from '../../../api.dto.js';

import { createApiProcedure } from '@features/api/backend/transport/api-procedure.js';

import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor } from '@features/api/backend/transport/context.js';
import { announcementsContract } from '../../../api.definition.js';
import type { AnnouncementsDependencies } from '../../../api.implementation.js';
export interface AnnouncementCreateDependencies<Actor extends ApiActor> {
	announcementService: Pick<AnnouncementsDependencies<Actor>['announcementService'], 'create'>;
}
export function createAnnouncementCreateProcedure<Actor extends ApiActor>(deps: AnnouncementCreateDependencies<Actor>) {
	return createApiProcedure<Actor>()(announcementsContract.create)
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const autoArchiveAt = toAnnouncementAutoArchiveAt(input.autoArchiveAt);
			if (autoArchiveAt != null && (Number.isNaN(autoArchiveAt.getTime()) || autoArchiveAt.getTime() <= Date.now())) {
				throw apiError({ code: 'INVALID_AUTO_ARCHIVE_AT', message: 'Invalid auto archive date.', id: '2a892bd5-487d-46a2-a5fe-3d85ad51defe' });
			}
			const { packed } = await deps.announcementService.create({ ...input, autoArchiveAt, updatedAt: null, imageUrl: input.imageUrl || null }, actor);
			return toPackedAnnouncement(packed);
		});
}
