/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';

export const voidFollowingUpdateAllInput = v.object({
	"notify": v.exactOptional(v.picklist(["normal", "none"])),
	"withReplies": v.exactOptional(v.boolean()),
});
export const voidFollowingUpdateAllOutput = v.void();
export const voidFollowingUpdateAllDefinition = defineEndpointContract(
	{ method: 'POST', path: "/following/update-all", tags: ["following", "users"] },
	voidFollowingUpdateAllInput,
	voidFollowingUpdateAllOutput,
);

export const voidMuteCreateInput = v.object({
	"userId": misskeyId,
	"expiresAt": v.exactOptional(v.pipe(v.nullable(v.pipe(v.number(), v.integer())), v.metadata({ "description": "A Unix Epoch timestamp that must lie in the future. `null` means an indefinite mute." }))),
});
export const voidMuteCreateOutput = v.void();
export const voidMuteCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/mute/create", tags: ["account"] },
	voidMuteCreateInput,
	voidMuteCreateOutput,
);

export const voidEndpointDefinitions = {
	"following/update-all": voidFollowingUpdateAllDefinition,
	"mute/create": voidMuteCreateDefinition,
} as const;

export const voidEndpointContracts = {
	"following/update-all": voidFollowingUpdateAllDefinition.contract,
	"mute/create": voidMuteCreateDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof voidEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof voidEndpointContracts>;
export type NativeVoidEndpoints = {
	[K in keyof typeof voidEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
