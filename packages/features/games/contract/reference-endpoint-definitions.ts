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

export const referenceReversiGamesInput = jsonObject({
	"limit": v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"my": v.optional(v.boolean(), false),
});
export const referenceReversiGamesOutput = v.array(packedReference("ReversiGameLite", { legacyOutputType: 'omit' }));
export const referenceReversiGamesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/reversi/games" },
	referenceReversiGamesInput,
	referenceReversiGamesOutput,
);

export const referenceEndpointDefinitions = {
	"reversi/games": referenceReversiGamesDefinition,
} as const;

export const referenceEndpointContracts = {
	"reversi/games": referenceReversiGamesDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof referenceEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof referenceEndpointContracts>;
export type ReferenceEndpoints = {
	[K in keyof typeof referenceEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
