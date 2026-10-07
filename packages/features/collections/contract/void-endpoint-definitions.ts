/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';

export const voidNotesFavoritesCreateInput = v.object({
	"noteId": misskeyId,
});
export const voidNotesFavoritesCreateOutput = v.void();
export const voidNotesFavoritesCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/favorites/create", tags: ["notes", "favorites"] },
	voidNotesFavoritesCreateInput,
	voidNotesFavoritesCreateOutput,
);

export const voidNotesFavoritesDeleteInput = v.object({
	"noteId": misskeyId,
});
export const voidNotesFavoritesDeleteOutput = v.void();
export const voidNotesFavoritesDeleteDefinition = defineEndpointContract(
	{ method: 'POST', path: "/notes/favorites/delete", tags: ["notes", "favorites"] },
	voidNotesFavoritesDeleteInput,
	voidNotesFavoritesDeleteOutput,
);

export const voidEndpointDefinitions = {
	"notes/favorites/create": voidNotesFavoritesCreateDefinition,
	"notes/favorites/delete": voidNotesFavoritesDeleteDefinition,
} as const;

export const voidEndpointContracts = {
	"notes/favorites/create": voidNotesFavoritesCreateDefinition.contract,
	"notes/favorites/delete": voidNotesFavoritesDeleteDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof voidEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof voidEndpointContracts>;
export type NativeVoidEndpoints = {
	[K in keyof typeof voidEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
