/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedNotesSearchInput = v.object({
	"query": v.string(),
	"rangeStartAt": v.exactOptional(v.nullable(v.pipe(v.number(), v.integer()))),
	"rangeEndAt": v.exactOptional(v.nullable(v.pipe(v.number(), v.integer()))),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"offset": v.optional(v.pipe(v.number(), v.integer()), 0),
	"host": v.exactOptional(v.pipe(v.string(), v.metadata({ "description": "The local host is represented with `.`." }))),
	"userId": v.optional(v.nullable(misskeyId), null),
	"channelId": v.optional(v.nullable(misskeyId), null),
});
export const packedNotesSearchOutput = v.array(packedReference("Note"));
export const packedNotesSearchDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/search", tags: ["notes"] },
	packedNotesSearchInput,
	packedNotesSearchOutput,
);

export const packedEndpointDefinitions = { 'notes/search': packedNotesSearchDefinition } as const;
export const packedEndpointContracts = { 'notes/search': packedNotesSearchDefinition.contract } as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
