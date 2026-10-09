/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { MiLocalUser } from '@features/users/backend/models/User.js';
import { NoteEntityService } from '@features/notes/backend/serializers/NoteEntityService.js';
import { RoleService } from '@features/roles/backend/services/RoleService.js';
import { IdService } from '@features/runtime/backend/services/IdService.js';
import { SearchService } from './services/SearchService.js';
import { createNoteSearchRouter } from './router.js';
type NoteSearchRouter = ReturnType<typeof createNoteSearchRouter<MiLocalUser>>;
/** Composed once after Nest initialization; domain services keep their existing lifetime. */
@Injectable()
export class NoteSearchApiProvider {
	private router: NoteSearchRouter | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): NoteSearchRouter {
		if (this.router !== undefined) return this.router;
		this.router = createNoteSearchRouter<MiLocalUser>({
			noteEntityService: this.moduleRef.get(NoteEntityService, { strict: false }),
			searchService: this.moduleRef.get(SearchService, { strict: false }),
			roleService: this.moduleRef.get(RoleService, { strict: false }),
			idService: this.moduleRef.get(IdService, { strict: false }),
		});
		return this.router;
	}
}
