/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { jsonString, misskeyId, objectParams } from '../../api/contract/index.js';

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

type AvatarDecorationContract = typeof avatarDecorationsContract & typeof avatarDecorationCommandsContract;
type Inputs = InferContractRouterInputs<AvatarDecorationContract>;
type Outputs = InferContractRouterOutputs<AvatarDecorationContract>;
export type AvatarDecorationEndpoints = {
	[K in keyof AvatarDecorationContract]: { req: Inputs[K]; res: Outputs[K] };
};
