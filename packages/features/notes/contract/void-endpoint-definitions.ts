/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';

export const voidAdminPromoCreateInput = v.object({
	"noteId": misskeyId,
	"expiresAt": v.pipe(v.number(), v.integer()),
});
export const voidAdminPromoCreateOutput = v.void();
export const voidAdminPromoCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/promo/create", tags: ["admin"] },
	voidAdminPromoCreateInput,
	voidAdminPromoCreateOutput,
);

export const voidNotesPollsVoteInput = v.object({
	"noteId": misskeyId,
	"choice": v.pipe(v.number(), v.integer()),
});
export const voidNotesPollsVoteOutput = v.void();
export const voidNotesPollsVoteDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/polls/vote", tags: ["notes"] },
	voidNotesPollsVoteInput,
	voidNotesPollsVoteOutput,
);

export const voidEndpointDefinitions = {
	"admin/promo/create": voidAdminPromoCreateDefinition,
	"notes/polls/vote": voidNotesPollsVoteDefinition,
} as const;

export const voidEndpointContracts = {
	"admin/promo/create": voidAdminPromoCreateDefinition.contract,
	"notes/polls/vote": voidNotesPollsVoteDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof voidEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof voidEndpointContracts>;
export type NativeVoidEndpoints = {
	[K in keyof typeof voidEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
