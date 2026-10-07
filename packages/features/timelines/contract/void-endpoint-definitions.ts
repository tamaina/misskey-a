/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';

export const voidAntennasDeleteInput = v.object({
	"antennaId": misskeyId,
});
export const voidAntennasDeleteOutput = v.void();
export const voidAntennasDeleteDefinition = defineEndpointContract(
	{ method: 'POST', path: "/antennas/delete", tags: ["antennas"] },
	voidAntennasDeleteInput,
	voidAntennasDeleteOutput,
);

export const voidAntennasRemoveNoteInput = v.object({
	"antennaId": misskeyId,
	"noteId": misskeyId,
});
export const voidAntennasRemoveNoteOutput = v.void();
export const voidAntennasRemoveNoteDefinition = defineEndpointContract(
	{ method: 'POST', path: "/antennas/remove-note", tags: ["antennas", "account", "notes"] },
	voidAntennasRemoveNoteInput,
	voidAntennasRemoveNoteOutput,
);

export const voidEndpointDefinitions = {
	"antennas/delete": voidAntennasDeleteDefinition,
	"antennas/remove-note": voidAntennasRemoveNoteDefinition,
} as const;

export const voidEndpointContracts = {
	"antennas/delete": voidAntennasDeleteDefinition.contract,
	"antennas/remove-note": voidAntennasRemoveNoteDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof voidEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof voidEndpointContracts>;
export type NativeVoidEndpoints = {
	[K in keyof typeof voidEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
