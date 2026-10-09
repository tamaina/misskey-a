/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '@features/api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '@features/api/backend/transport/context.js';
import { announcementsContract } from '../../api.definition.js';
import type { AnnouncementsDependencies } from '../../api.implementation.js';
export interface ReadAnnouncementDependencies<Actor extends ApiActor> {
	announcementService: Pick<AnnouncementsDependencies<Actor>['announcementService'], 'read'>;
}
export function createReadAnnouncementProcedure<Actor extends ApiActor>(deps: ReadAnnouncementDependencies<Actor>) {
	return implement(announcementsContract.read, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>()
		.use(authentication<Actor>())
		.use(apiPolicy<Actor>({ name: announcementsContract.read['~orpc'].meta.requestName, requireCredential: true, kind: 'write:account' }))
		.use(requirePrincipal<Actor>())
		.handler(async ({ input, context }) => {
			const actor = context.principal;
			await deps.announcementService.read(actor, input.announcementId);
		});
}
