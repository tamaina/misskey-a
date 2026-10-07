/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createProcedureClient, implement } from '@orpc/server';
import type { JsonSchema } from '@valibot/to-json-schema';
import { avatarDecorationResult, avatarDecorationsContract } from '../contract/index.js';
import type { AvatarDecorationEndpoints } from '../contract/index.js';
import { objectParams } from '@features/api/contract/index.js';
import { toLegacyJsonSchema } from '@features/api/backend/index.js';
import { avatarDecorationCommandInputs, avatarDecorationCommandsContract } from '../contract/index.js';

export interface AvatarDecorationCommandsContext<Actor extends { id: string }> {
	actor: Actor;
}

export interface AvatarDecorationUpdateValues {
	name: string | undefined;
	description: string | undefined;
	url: string | undefined;
	roleIdsThatCanBeUsedThisDecoration: string[] | undefined;
	category: string | null | undefined;
}

/** Only the service operations required by these command endpoints. */
export interface AvatarDecorationCommandsDependencies<Actor extends { id: string }> {
	update(id: string, values: AvatarDecorationUpdateValues, actor: Actor): Promise<unknown>;
	delete(id: string, actor: Actor): Promise<unknown>;
}

function requireAvatarDecorationActor<Actor extends { id: string }>(context: AvatarDecorationCommandsContext<Actor> | null | undefined): Actor {
	if (context == null || context.actor == null || typeof context.actor.id !== 'string' || context.actor.id.length === 0) {
		throw new Error('A trusted avatar-decoration actor is required');
	}

	return context.actor;
}

/** Build the admin commands separately from the public decoration-read factory. */
export function createAvatarDecorationCommands<Actor extends { id: string }>(deps: AvatarDecorationCommandsDependencies<Actor>) {
	const clientContext = (context: AvatarDecorationCommandsContext<Actor>) => context;

	const update = createProcedureClient(implement(avatarDecorationCommandsContract['admin/avatar-decorations/update'])
		.$context<AvatarDecorationCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireAvatarDecorationActor(context);
			await deps.update(input.id, {
				name: input.name,
				description: input.description,
				url: input.url,
				roleIdsThatCanBeUsedThisDecoration: input.roleIdsThatCanBeUsedThisDecoration,
				category: input.category,
			}, actor);
		}), { context: clientContext });

	const deleteDecoration = createProcedureClient(implement(avatarDecorationCommandsContract['admin/avatar-decorations/delete'])
		.$context<AvatarDecorationCommandsContext<Actor>>()
		.handler(async ({ input, context }) => {
			const actor = requireAvatarDecorationActor(context);
			await deps.delete(input.id, actor);
		}), { context: clientContext });

	return {
		'admin/avatar-decorations/update': update,
		'admin/avatar-decorations/delete': deleteDecoration,
	};
}

export type AvatarDecorationCommandsFeature<Actor extends { id: string }> = ReturnType<typeof createAvatarDecorationCommands<Actor>>;

export const legacyAvatarDecorationCommandSchemas = {
	'admin/avatar-decorations/update': { input: toLegacyJsonSchema(avatarDecorationCommandInputs['admin/avatar-decorations/update'], { target: 'openapi-3.0' }) },
	'admin/avatar-decorations/delete': { input: toLegacyJsonSchema(avatarDecorationCommandInputs['admin/avatar-decorations/delete'], { target: 'openapi-3.0' }) },
};

export interface AvatarDecorationsDependencies {
	readDecorations(): Promise<readonly {
		id: string;
		name: string;
		description: string;
		url: string;
		roleIdsThatCanBeUsedThisDecoration: readonly string[];
		category: string | null;
	}[]>;
	readRoles(): Promise<readonly {
		id: string;
		isPublic: boolean;
	}[]>;
}

export interface AvatarDecorationsContext {
	authenticated: boolean;
}

/** Return public-role eligibility anonymously and all existing-role eligibility to authenticated callers. */
export function createAvatarDecorations(deps: AvatarDecorationsDependencies) {
	const procedure = implement(avatarDecorationsContract['get-avatar-decorations'])
		.$context<AvatarDecorationsContext>()
		.handler(async ({ context }) => {
			const decorations = await deps.readDecorations();
			const roles = await deps.readRoles();
			const visibleRoleIds = new Set(roles
				.filter(role => context.authenticated || role.isPublic)
				.map(role => role.id));

			return decorations.map(decoration => ({
				id: decoration.id,
				name: decoration.name,
				description: decoration.description,
				url: decoration.url,
				roleIdsThatCanBeUsedThisDecoration: decoration.roleIdsThatCanBeUsedThisDecoration.filter(roleId => visibleRoleIds.has(roleId)),
				...(decoration.category === undefined ? {} : { category: decoration.category }),
			})) satisfies AvatarDecorationEndpoints['get-avatar-decorations']['res'];
		});

	const getAvatarDecorations = createProcedureClient(procedure, {
		// The client context is supplied per invocation by the trusted adapter.
		// Treat a missing or malformed runtime context as anonymous.
		context: (clientContext: AvatarDecorationsContext) => ({ authenticated: clientContext?.authenticated === true }),
	});

	return { 'get-avatar-decorations': getAvatarDecorations };
}

export type AvatarDecorationsFeature = ReturnType<typeof createAvatarDecorations>;

const input = toLegacyJsonSchema(objectParams);
const output = toLegacyJsonSchema(avatarDecorationResult, { target: 'openapi-3.0' });
export const legacyAvatarDecorationSchemas: { input: JsonSchema; output: JsonSchema } = { input, output };
