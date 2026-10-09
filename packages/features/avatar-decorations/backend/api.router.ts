/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { implement } from '@orpc/server';
import type { ApiActor, ApiContext } from '../../api/backend/transport/context.js';
import { avatarDecorationsContract } from './api.contract.js';
import type { AvatarDecorationsDependencies } from './api.dependencies.js';
import { createAvatarDecorationCreateProcedure } from './endpoints/admin/avatar-decorations/create.js';
import { createAvatarDecorationDeleteProcedure } from './endpoints/admin/avatar-decorations/delete.js';
import { createAvatarDecorationListProcedure } from './endpoints/admin/avatar-decorations/list.js';
import { createAvatarDecorationUpdateProcedure } from './endpoints/admin/avatar-decorations/update.js';
import { createGetAvatarDecorationsProcedure } from './endpoints/get-avatar-decorations.js';
export function createAvatarDecorationsRouter<Actor extends ApiActor>(deps: AvatarDecorationsDependencies<Actor>) {
	return implement(avatarDecorationsContract, { initialInputValidationIndex: Number.POSITIVE_INFINITY }).$context<ApiContext<Actor>>().router({
		create: createAvatarDecorationCreateProcedure(deps),
		delete: createAvatarDecorationDeleteProcedure(deps),
		list: createAvatarDecorationListProcedure(deps),
		update: createAvatarDecorationUpdateProcedure(deps),
		get: createGetAvatarDecorationsProcedure(deps),
	});
}
