/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';

export const inlineDriveInput = v.object({});
export const inlineDriveOutput = v.strictObject({
	"capacity": v.number(),
	"usage": v.number(),
});
export const inlineDriveDefinition = defineEndpointContract(
	{ method: 'POST', path: '/drive', tags: ["drive", "account"] },
	inlineDriveInput,
	inlineDriveOutput,
);

export const inlineDriveFilesCheckExistenceInput = v.object({
	"md5": v.string(),
});
export const inlineDriveFilesCheckExistenceOutput = v.boolean();
export const inlineDriveFilesCheckExistenceDefinition = defineEndpointContract(
	{ method: 'POST', path: '/drive/files/check-existence', tags: ["drive"] },
	inlineDriveFilesCheckExistenceInput,
	inlineDriveFilesCheckExistenceOutput,
);

export const inlineEndpointDefinitions = {
	"drive": inlineDriveDefinition,
	"drive/files/check-existence": inlineDriveFilesCheckExistenceDefinition,
} as const;

export const inlineEndpointContracts = {
	"drive": inlineDriveDefinition.contract,
	"drive/files/check-existence": inlineDriveFilesCheckExistenceDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof inlineEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof inlineEndpointContracts>;
export type NativeInlineEndpoints = {
	[K in keyof typeof inlineEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
