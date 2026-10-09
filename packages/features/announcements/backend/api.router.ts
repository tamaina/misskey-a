/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { authentication, apiPolicy, requirePrincipal } from '../../api/backend/transport/middleware.js';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import { announcementsContract } from './api.contract.js';
import type { AnnouncementsOperations } from './api.operations.js';

export type AnnouncementsContext<Actor extends ApiActor> = ApiContext<Actor> & {
	operations: { announcements: AnnouncementsOperations<Actor> };
};

export function createAnnouncementsRouter<Actor extends ApiActor>() {
	const api = implement(announcementsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<AnnouncementsContext<Actor>>().use(authentication<Actor>());
	return api.router({
		create: api.create.use(apiPolicy<Actor>({ name: 'admin/announcements/create', requireCredential: true, requireModerator: true, kind: 'write:admin:announcements' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.announcements.create(input, context.principal)),
		delete: api.delete.use(apiPolicy<Actor>({ name: 'admin/announcements/delete', requireCredential: true, requireModerator: true, kind: 'write:admin:announcements' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.announcements.delete(input, context.principal)),
		adminList: api.adminList.use(apiPolicy<Actor>({ name: 'admin/announcements/list', requireCredential: true, requireModerator: true, kind: 'read:admin:announcements' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.announcements.adminList(input, context.principal)),
		update: api.update.use(apiPolicy<Actor>({ name: 'admin/announcements/update', requireCredential: true, requireModerator: true, kind: 'write:admin:announcements' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.announcements.update(input, context.principal)),
		list: api.list.use(apiPolicy<Actor>({ name: 'announcements' }))
			.handler(({ input, context }) => context.operations.announcements.list(input, context.principal)),
		show: api.show.use(apiPolicy<Actor>({ name: 'announcements/show' }))
			.handler(({ input, context }) => context.operations.announcements.show(input, context.principal)),
		read: api.read.use(apiPolicy<Actor>({ name: 'i/read-announcement', requireCredential: true, kind: 'write:account' })).use(requirePrincipal<Actor>())
			.handler(({ input, context }) => context.operations.announcements.read(input, context.principal)),
	});
}
