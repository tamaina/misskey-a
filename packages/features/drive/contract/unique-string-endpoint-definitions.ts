/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId, uniqueStringArray } from '../../api/contract/index.js';

export const uniqueDriveFilesMoveBulkInput = v.object({
	"fileIds": v.pipe(uniqueStringArray(misskeyId), v.minLength(1), v.maxLength(100)),
	"folderId": v.exactOptional(v.nullable(misskeyId)),
});
export const uniqueDriveFilesMoveBulkOutput = v.void();
export const uniqueDriveFilesMoveBulkDefinition = defineEndpointContract(
	{ method: 'POST', path: "/drive/files/move-bulk", tags: ["drive"] },
	uniqueDriveFilesMoveBulkInput,
	uniqueDriveFilesMoveBulkOutput,
);

export const uniqueStringEndpointDefinitions = {
	"drive/files/move-bulk": uniqueDriveFilesMoveBulkDefinition,
} as const;

export const uniqueStringEndpointContracts = {
	"drive/files/move-bulk": uniqueDriveFilesMoveBulkDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof uniqueStringEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof uniqueStringEndpointContracts>;
export type UniqueStringEndpoints = {
	[K in keyof typeof uniqueStringEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
