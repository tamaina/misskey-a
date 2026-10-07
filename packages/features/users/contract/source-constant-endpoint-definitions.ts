/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { jsonObject } from '../../api/contract/json-object.js';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { packedAchievementNameSchema } from './packed.js';

export const constantIClaimAchievementInput = jsonObject({
	"name": packedAchievementNameSchema,
});
export const constantIClaimAchievementOutput = v.void();
export const constantIClaimAchievementDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/claim-achievement" },
	constantIClaimAchievementInput,
	constantIClaimAchievementOutput,
);

export const sourceConstantEndpointDefinitions = {
	"i/claim-achievement": constantIClaimAchievementDefinition,
} as const;

export const sourceConstantEndpointContracts = {
	"i/claim-achievement": constantIClaimAchievementDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof sourceConstantEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof sourceConstantEndpointContracts>;
export type SourceConstantEndpoints = {
	[K in keyof typeof sourceConstantEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
