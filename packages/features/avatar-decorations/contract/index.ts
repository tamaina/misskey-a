/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { objectParams } from '../../api/contract/index.js';

export const avatarDecorationResult = v.array(v.object({
	id: v.pipe(v.string(), v.metadata({ format: 'id', example: 'xxxxxxxxxx' })),
	name: v.string(),
	description: v.string(),
	url: v.string(),
	roleIdsThatCanBeUsedThisDecoration: v.array(v.pipe(v.string(), v.metadata({ format: 'id' }))),
	category: v.pipe(v.optional(v.nullable(v.string())), v.metadata({ optional: true })),
}));

export const avatarDecorationsContract = {
	'get-avatar-decorations': oc.route({ method: 'POST', path: '/get-avatar-decorations', tags: ['users'] })
		.input(v.optional(objectParams, {}))
		.output(avatarDecorationResult),
};

type Inputs = InferContractRouterInputs<typeof avatarDecorationsContract>;
type Outputs = InferContractRouterOutputs<typeof avatarDecorationsContract>;
export type AvatarDecorationEndpoints = {
	[K in keyof typeof avatarDecorationsContract]: { req: Inputs[K]; res: Outputs[K] };
};
