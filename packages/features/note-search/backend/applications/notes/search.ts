/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';

import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { apiError } from '@features/api/backend/transport/orpc-error.js';
import { SearchService } from '../../services/SearchService.js';

import { type notesSearchContract, notesSearchErrors } from '../../endpoints/notes/search.contract.js';
import type * as v from 'valibot';
import type { MiLocalUser } from '@features/users/backend/models/User.js';

@Injectable()
export class NotesSearchApplicationService {
	constructor(
		private noteEntityService: NoteEntityService,
		private searchService: SearchService,
		private roleService: RoleService,
		private idService: IdService,
	) {}

	async execute(ps: v.InferOutput<NonNullable<typeof notesSearchContract['~orpc']['inputSchema']>>, me: MiLocalUser | null) {
		const untilId = ps.untilId ?? (ps.untilDate ? this.idService.gen(ps.untilDate!) : undefined);
		const sinceId = ps.sinceId ?? (ps.sinceDate ? this.idService.gen(ps.sinceDate!) : undefined);

		const policies = await this.roleService.getUserPolicies(me ? me.id : null);
		if (!policies.canSearchNotes) {
			throw apiError(notesSearchErrors.unavailable);
		}

		const notes = await this.searchService.searchNote(ps.query, me, {
			userId: ps.userId,
			channelId: ps.channelId,
			host: ps.host,
			rangeStartAt: ps.rangeStartAt,
			rangeEndAt: ps.rangeEndAt,
		}, {
			untilId: untilId,
			sinceId: sinceId,
			limit: ps.limit,
		});

		return await this.noteEntityService.packMany(notes, me);
	}
}
