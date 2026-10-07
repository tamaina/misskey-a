/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const referenceUsersAchievementsInput = jsonObject({
	"userId": misskeyId,
});
export const referenceUsersAchievementsOutput = v.array(packedReference("Achievement", { legacyOutputType: 'omit' }));
export const referenceUsersAchievementsDefinition = defineEndpointContract(
	{ method: 'POST', path: "/users/achievements" },
	referenceUsersAchievementsInput,
	referenceUsersAchievementsOutput,
);

export const referenceEndpointDefinitions = {
	"users/achievements": referenceUsersAchievementsDefinition,
} as const;

export const referenceEndpointContracts = {
	"users/achievements": referenceUsersAchievementsDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof referenceEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof referenceEndpointContracts>;
export type ReferenceEndpoints = {
	[K in keyof typeof referenceEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
