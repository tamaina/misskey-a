/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { announcementsContract } from '../../../api.definition.js';
import type { AnnouncementsDependencies } from '../../../api.implementation.js';
export interface AnnouncementCreateDependencies<Actor extends ApiActor> {
	announcementService: Pick<AnnouncementsDependencies<Actor>['announcementService'], 'create'>;
}
export function createAnnouncementCreateProcedure<Actor extends ApiActor>(deps: AnnouncementCreateDependencies<Actor>) {
	return implement(announcementsContract.create, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: announcementsContract.create['~orpc'].meta.requestName, requireCredential: true, requireModerator: true, kind: 'write:admin:announcements' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			const { packed } = await deps.announcementService.create({ ...input, updatedAt: null, imageUrl: input.imageUrl || null }, actor);
			return packed;
		});
}
