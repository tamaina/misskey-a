/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedBubbleGameRankingInput = v.object({
	"gameMode": v.string(),
});
export const packedBubbleGameRankingOutput = v.array(v.strictObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
		"score": v.pipe(v.number(), v.integer()),
		"user": v.optional(packedReference("UserLite")),
	}));
export const packedBubbleGameRankingDefinition = defineEndpointContract(
	{ method: 'POST', path: "/bubble-game/ranking" },
	packedBubbleGameRankingInput,
	packedBubbleGameRankingOutput,
);

export const packedReversiMatchInput = v.object({
	"userId": v.exactOptional(v.nullable(misskeyId)),
	"noIrregularRules": v.optional(v.boolean(), false),
	"multiple": v.optional(v.boolean(), false),
});
export const packedReversiMatchOutput = v.optional(packedReference("ReversiGameDetailed"));
export const packedReversiMatchDefinition = defineEndpointContract(
	{ method: 'POST', path: "/reversi/match" },
	packedReversiMatchInput,
	packedReversiMatchOutput,
);

export const packedReversiShowGameInput = v.object({
	"gameId": misskeyId,
});
export const packedReversiShowGameOutput = packedReference("ReversiGameDetailed");
export const packedReversiShowGameDefinition = defineEndpointContract(
	{ method: 'POST', path: "/reversi/show-game" },
	packedReversiShowGameInput,
	packedReversiShowGameOutput,
);

export const packedReversiVerifyInput = v.object({
	"gameId": misskeyId,
	"crc32": v.string(),
});
export const packedReversiVerifyOutput = v.strictObject({
	"desynced": v.boolean(),
	"game": v.exactOptional(v.nullable(packedReference("ReversiGameDetailed"))),
});
export const packedReversiVerifyDefinition = defineEndpointContract(
	{ method: 'POST', path: "/reversi/verify" },
	packedReversiVerifyInput,
	packedReversiVerifyOutput,
);

export const packedEndpointDefinitions = {
	"bubble-game/ranking": packedBubbleGameRankingDefinition,
	"reversi/match": packedReversiMatchDefinition,
	"reversi/show-game": packedReversiShowGameDefinition,
	"reversi/verify": packedReversiVerifyDefinition,
} as const;

export const packedEndpointContracts = {
	"bubble-game/ranking": packedBubbleGameRankingDefinition.contract,
	"reversi/match": packedReversiMatchDefinition.contract,
	"reversi/show-game": packedReversiShowGameDefinition.contract,
	"reversi/verify": packedReversiVerifyDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
