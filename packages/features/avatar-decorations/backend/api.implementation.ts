/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import { RoleService } from '../../roles/backend/services/RoleService.js';
import { IdService } from '../../runtime/backend/services/IdService.js';
import type { MiLocalUser } from '../../users/backend/models/User.js';
import type { MiAvatarDecoration } from './models/AvatarDecoration.js';
import { AvatarDecorationService } from './services/AvatarDecorationService.js';
import { avatarDecorationsContract } from './api.definition.js';
import { createAvatarDecorationCreateProcedure } from './endpoints/admin/avatar-decorations/create.js';
import { createAvatarDecorationDeleteProcedure } from './endpoints/admin/avatar-decorations/delete.js';
import { createAvatarDecorationListProcedure } from './endpoints/admin/avatar-decorations/list.js';
import { createAvatarDecorationUpdateProcedure } from './endpoints/admin/avatar-decorations/update.js';
import { createGetAvatarDecorationsProcedure } from './endpoints/get-avatar-decorations.js';

export interface AvatarDecorationUpdateValues {
	name: string | undefined;
	description: string | undefined;
	url: string | undefined;
	roleIdsThatCanBeUsedThisDecoration: string[] | undefined;
	category: string | null | undefined;
}
export interface AvatarDecorationsDependencies<Actor extends ApiActor> {
	avatarDecorationService: {
		create(values: Partial<MiAvatarDecoration>, actor: Actor): Promise<MiAvatarDecoration>;
		update(id: string, values: AvatarDecorationUpdateValues, actor: Actor): Promise<void>;
		delete(id: string, actor: Actor): Promise<void>;
		getAll(noCache?: boolean): Promise<MiAvatarDecoration[]>;
	};
	idService: Pick<IdService, 'parse'>;
	readRoles(): Promise<readonly { id: string; isPublic: boolean }[]>;
}

export function createAvatarDecorationsRouter<Actor extends ApiActor>(deps: AvatarDecorationsDependencies<Actor>) {
	return implement(avatarDecorationsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().router({
		create: createAvatarDecorationCreateProcedure(deps),
		delete: createAvatarDecorationDeleteProcedure(deps),
		list: createAvatarDecorationListProcedure(deps),
		update: createAvatarDecorationUpdateProcedure(deps),
		get: createGetAvatarDecorationsProcedure(deps),
	});
}

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
