/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import { announcementsContract } from './api.contract.js';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import type { AnnouncementsDependencies } from './api.dependencies.js';
import { createAnnouncementCreateProcedure } from './endpoints/admin/announcements/create.js';
import { createAnnouncementDeleteProcedure } from './endpoints/admin/announcements/delete.js';
import { createAnnouncementUpdateProcedure } from './endpoints/admin/announcements/update.js';
import { createAnnouncementAdminListProcedure } from './endpoints/admin/announcements/list.js';
import { createAnnouncementsListProcedure } from './endpoints/announcements.js';
import { createAnnouncementShowProcedure } from './endpoints/announcements/show.js';
import { createReadAnnouncementProcedure } from './endpoints/i/read-announcement.js';
export function createAnnouncementsRouter<Actor extends ApiActor>(deps: AnnouncementsDependencies<Actor>) {
	return implement(announcementsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().router({
		create: createAnnouncementCreateProcedure(deps),
		delete: createAnnouncementDeleteProcedure(deps),
		update: createAnnouncementUpdateProcedure(deps),
		adminList: createAnnouncementAdminListProcedure(deps),
		list: createAnnouncementsListProcedure(deps),
		show: createAnnouncementShowProcedure(deps),
		read: createReadAnnouncementProcedure(deps),
	});
}
