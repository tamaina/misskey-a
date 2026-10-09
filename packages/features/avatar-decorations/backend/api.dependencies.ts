/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import type { ApiActor } from '../../api/backend/transport/context.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';
import type { MiAvatarDecoration } from './models/AvatarDecoration.js';
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
