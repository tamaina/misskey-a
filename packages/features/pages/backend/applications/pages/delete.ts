/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { MiDriveFile, PagesRepository, UsersRepository } from '@features/persistence/backend/repositories/models.js';

import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@features/moderation/backend/services/ModerationLogService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { IdentifiableError } from '@features/runtime/backend/errors/identifiable-error.js';
import { PageService } from '../../services/PageService.js';

import type { MiLocalUser } from '@features/users/backend/models/User.js';
import type * as v from 'valibot';
import { pagesDeleteInput, pagesDeleteErrors } from '../../endpoints/pages/delete.contract.js';

@Injectable()
export class PagesDeleteApplicationService {
	constructor(
		private pageService: PageService,
	) {}

	async execute(ps: v.InferOutput<typeof pagesDeleteInput>, me: MiLocalUser) {
		try {
			await this.pageService.delete(me, ps.pageId);
		} catch (err) {
			if (err instanceof IdentifiableError) {
				if (err.id === '66aefd3c-fdb2-4a71-85ae-cc18bea85d3f') throw apiError(pagesDeleteErrors.noSuchPage);
				if (err.id === 'd0017699-8256-46f1-aed4-bc03bed73616') throw apiError(pagesDeleteErrors.accessDenied);
			}
			throw err;
		}
	}
}
