/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';

export const voidBubbleGameRegisterInput = v.object({
	"score": v.pipe(v.pipe(v.number(), v.integer()), v.minValue(0)),
	"seed": jsonString({ "minLength": 1, "maxLength": 1024 }),
	"logs": v.array(v.array(v.number())),
	"gameMode": v.string(),
	"gameVersion": v.pipe(v.number(), v.integer()),
});
export const voidBubbleGameRegisterOutput = v.void();
export const voidBubbleGameRegisterDefinition = defineEndpointContract(
	{ method: 'POST', path: "/bubble-game/register" },
	voidBubbleGameRegisterInput,
	voidBubbleGameRegisterOutput,
);

export const voidReversiCancelMatchInput = v.object({
	"userId": v.exactOptional(v.nullable(misskeyId)),
});
export const voidReversiCancelMatchOutput = v.void();
export const voidReversiCancelMatchDefinition = defineEndpointContract(
	{ method: 'POST', path: "/reversi/cancel-match" },
	voidReversiCancelMatchInput,
	voidReversiCancelMatchOutput,
);

export const voidReversiSurrenderInput = v.object({
	"gameId": misskeyId,
});
export const voidReversiSurrenderOutput = v.void();
export const voidReversiSurrenderDefinition = defineEndpointContract(
	{ method: 'POST', path: "/reversi/surrender" },
	voidReversiSurrenderInput,
	voidReversiSurrenderOutput,
);

export const voidEndpointDefinitions = {
	"bubble-game/register": voidBubbleGameRegisterDefinition,
	"reversi/cancel-match": voidReversiCancelMatchDefinition,
	"reversi/surrender": voidReversiSurrenderDefinition,
} as const;

export const voidEndpointContracts = {
	"bubble-game/register": voidBubbleGameRegisterDefinition.contract,
	"reversi/cancel-match": voidReversiCancelMatchDefinition.contract,
	"reversi/surrender": voidReversiSurrenderDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof voidEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof voidEndpointContracts>;
export type NativeVoidEndpoints = {
	[K in keyof typeof voidEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
