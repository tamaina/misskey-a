/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ApiActor } from '../../api/backend/transport/context.js';
import type { IdService } from '../../runtime/backend/services/IdService.js';
import type { MiAvatarDecoration } from './models/AvatarDecoration.js';
import type { avatarDecorationsContract } from './api.contract.js';
import type { InferSchemaOutput, InferContractRouterOutputs } from '@orpc/contract';

export interface AvatarDecorationUpdateValues {
	name: string | undefined;
	description: string | undefined;
	url: string | undefined;
	roleIdsThatCanBeUsedThisDecoration: string[] | undefined;
	category: string | null | undefined;
}

type Inputs = { [K in keyof typeof avatarDecorationsContract]: InferSchemaOutput<NonNullable<(typeof avatarDecorationsContract)[K]['~orpc']['inputSchema']>> };
type Outputs = InferContractRouterOutputs<typeof avatarDecorationsContract>;
export interface AvatarDecorationsOperations<Actor extends ApiActor> {
	create(input: Inputs['create'], actor: Actor): Promise<Outputs['create']>;
	delete(input: Inputs['delete'], actor: Actor): Promise<void>;
	list(input: Inputs['list'], actor: Actor): Promise<Outputs['list']>;
	update(input: Inputs['update'], actor: Actor): Promise<void>;
	get(input: Inputs['get'], actor: Actor | null): Promise<Outputs['get']>;
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

export function createAvatarDecorationsOperations<Actor extends ApiActor>(deps: AvatarDecorationsDependencies<Actor>): AvatarDecorationsOperations<Actor> {
	const pack = (row: MiAvatarDecoration) => ({
		id: row.id, createdAt: deps.idService.parse(row.id).date.toISOString(), updatedAt: row.updatedAt?.toISOString() ?? null,
		name: row.name, description: row.description, url: row.url,
		roleIdsThatCanBeUsedThisDecoration: row.roleIdsThatCanBeUsedThisDecoration, category: row.category,
	});
	return {
		async create(input, actor) {
			const row = await deps.avatarDecorationService.create({
				name: input.name, description: input.description, url: input.url,
				roleIdsThatCanBeUsedThisDecoration: input.roleIdsThatCanBeUsedThisDecoration, category: input.category,
			}, actor);
			return { ...pack(row), updatedAt: null };
		},
		async delete(input, actor) {
			await deps.avatarDecorationService.delete(input.id, actor);
		},
		async list() {
			return (await deps.avatarDecorationService.getAll(true)).map(pack);
		},
		async update(input, actor) {
			await deps.avatarDecorationService.update(input.id, {
				name: input.name, description: input.description, url: input.url,
				roleIdsThatCanBeUsedThisDecoration: input.roleIdsThatCanBeUsedThisDecoration, category: input.category,
			}, actor);
		},
		async get(_input, actor) {
			const decorations = await deps.avatarDecorationService.getAll(true);
			const roles = await deps.readRoles();
			const visibleRoleIds = new Set(roles.filter(role => actor !== null || role.isPublic).map(role => role.id));
			return decorations.map(row => ({
				id: row.id, name: row.name, description: row.description, url: row.url,
				roleIdsThatCanBeUsedThisDecoration: row.roleIdsThatCanBeUsedThisDecoration.filter(id => visibleRoleIds.has(id)),
				category: row.category,
			}));
		},
	};
}
