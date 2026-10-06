/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createProcedureClient, implement } from '@orpc/server';
import type { JsonSchema } from '@valibot/to-json-schema';
import { avatarDecorationResult, avatarDecorationsContract } from '../contract/index.js';
import type { AvatarDecorationEndpoints } from '../contract/index.js';
import { objectParams } from '../../api/contract/index.js';
import { toLegacyJsonSchema } from '../../api/backend/index.js';

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
				category: decoration.category,
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
