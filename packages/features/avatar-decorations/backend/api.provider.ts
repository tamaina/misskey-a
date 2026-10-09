/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { RoleService } from '../../roles/backend/services/RoleService.js';
import { IdService } from '../../runtime/backend/services/IdService.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import { AvatarDecorationService } from './services/AvatarDecorationService.js';
import { createAvatarDecorationsRouter } from './api.router.js';
type Router = ReturnType<typeof createAvatarDecorationsRouter<MiLocalUser>>;
@Injectable()
export class AvatarDecorationsApiProvider {
	private router: Router | undefined;
	constructor(private readonly moduleRef: ModuleRef) { }
	compose(): Router {
		if (this.router !== undefined) return this.router;
		const roles = this.moduleRef.get(RoleService, { strict: false });
		const decorations = this.moduleRef.get(AvatarDecorationService, { strict: false });
		this.router = createAvatarDecorationsRouter<MiLocalUser>({
			avatarDecorationService: {
				create: (values, actor) => decorations.create(values, actor),
				update: (id, values, actor) => decorations.update(id, values, actor),
				delete: (id, actor) => decorations.delete(id, actor),
				getAll: noCache => decorations.getAll(noCache),
			},
			idService: this.moduleRef.get(IdService, { strict: false }),
			readRoles: () => roles.getRoles(),
		});
		return this.router;
	}
}
