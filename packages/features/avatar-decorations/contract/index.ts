/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId, objectParams } from '../../api/contract/index.js';
import { resultObject } from '../../api/contract/result-object.js';

export const avatarDecorationResult = v.array(v.object({
	id: v.pipe(v.string(), v.metadata({ format: 'id', example: 'xxxxxxxxxx' })),
	name: v.string(),
	description: v.string(),
	url: v.string(),
	roleIdsThatCanBeUsedThisDecoration: v.array(v.pipe(v.string(), v.metadata({ format: 'id' }))),
	category: v.pipe(v.exactOptional(v.nullable(v.string())), v.metadata({ optional: true })),
}));

/** Inputs for the legacy avatar-decoration administration endpoints. */
export const avatarDecorationCommandInputs = {
	'admin/avatar-decorations/update': v.looseObject({
		id: misskeyId,
		name: v.exactOptional(jsonString({ minLength: 1 })),
		description: v.exactOptional(v.string()),
		url: v.exactOptional(jsonString({ minLength: 1 })),
		roleIdsThatCanBeUsedThisDecoration: v.exactOptional(v.array(v.string())),
		category: v.exactOptional(v.nullable(v.string())),
	}),
	'admin/avatar-decorations/delete': v.looseObject({
		id: misskeyId,
	}),
};

const avatarDecorationAdminResultFields = {
	createdAt: v.pipe(v.string(), v.metadata({ format: 'date-time' })),
	updatedAt: v.pipe(v.nullable(v.string()), v.metadata({ format: 'date-time' })),
	name: v.string(),
	description: v.string(),
	url: v.string(),
	roleIdsThatCanBeUsedThisDecoration: v.array(v.pipe(v.string(), v.metadata({ format: 'id' }))),
};

export const createAvatarDecorationInput = v.looseObject({
	name: jsonString({ minLength: 1 }),
	description: v.string(),
	url: jsonString({ minLength: 1 }),
	roleIdsThatCanBeUsedThisDecoration: v.exactOptional(v.array(v.string())),
	category: v.exactOptional(v.nullable(v.string())),
});

export const createAvatarDecorationOutput = resultObject({
	id: v.pipe(v.string(), v.metadata({ format: 'id' })),
	...avatarDecorationAdminResultFields,
	category: v.nullable(v.string()),
});

export const createAvatarDecorationDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/avatar-decorations/create', tags: ['admin'] },
	createAvatarDecorationInput,
	createAvatarDecorationOutput,
);

export const createAvatarDecorationContract = createAvatarDecorationDefinition.contract;

export const listAvatarDecorationsInput = v.looseObject({
	limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
	sinceId: v.exactOptional(misskeyId),
	untilId: v.exactOptional(misskeyId),
	sinceDate: v.exactOptional(v.pipe(v.number(), v.integer())),
	untilDate: v.exactOptional(v.pipe(v.number(), v.integer())),
	userId: v.exactOptional(v.nullable(misskeyId)),
});

export const listAvatarDecorationsOutput = v.array(resultObject({
	id: v.pipe(v.string(), v.metadata({ format: 'id', example: 'xxxxxxxxxx' })),
	...avatarDecorationAdminResultFields,
	category: v.exactOptional(v.nullable(v.string())),
}));

export const listAvatarDecorationsDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/avatar-decorations/list', tags: ['admin'] },
	listAvatarDecorationsInput,
	listAvatarDecorationsOutput,
);

export const listAvatarDecorationsContract = listAvatarDecorationsDefinition.contract;

export const avatarDecorationAdminContracts = {
	'admin/avatar-decorations/create': createAvatarDecorationContract,
	'admin/avatar-decorations/list': listAvatarDecorationsContract,
};

export const avatarDecorationCommandsContract = {
	'admin/avatar-decorations/update': oc.route({ method: 'POST', path: '/admin/avatar-decorations/update', tags: ['admin'] })
		.input(avatarDecorationCommandInputs['admin/avatar-decorations/update'])
		.output(v.void()),
	'admin/avatar-decorations/delete': oc.route({ method: 'POST', path: '/admin/avatar-decorations/delete', tags: ['admin'] })
		.input(avatarDecorationCommandInputs['admin/avatar-decorations/delete'])
		.output(v.void()),
};

export const avatarDecorationsContract = {
	'get-avatar-decorations': oc.route({ method: 'POST', path: '/get-avatar-decorations', tags: ['users'] })
		.input(v.optional(objectParams, {}))
		.output(avatarDecorationResult),
};

type AvatarDecorationContract = typeof avatarDecorationsContract & typeof avatarDecorationCommandsContract & typeof avatarDecorationAdminContracts;
type Inputs = InferContractRouterInputs<AvatarDecorationContract>;
type Outputs = InferContractRouterOutputs<AvatarDecorationContract>;
export type AvatarDecorationEndpoints = {
	[K in keyof AvatarDecorationContract]: { req: Inputs[K]; res: Outputs[K] };
};
