/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { jsonString, misskeyId } from '@features/api/contract/index.js';
import { defineMultipartEndpointContract } from '@features/api/contract/multipart-endpoint.js';
import { packedReference } from '@features/api/contract/packed-reference.js';
import { DB_MAX_IMAGE_COMMENT_LENGTH } from '@features/drive/contract/image-comment-limit.js';

export const driveFilesCreateOutput = packedReference('DriveFile');
export const driveFilesCreateDefinition = defineMultipartEndpointContract(
	{ method: 'POST', path: '/drive/files/create', tags: ['drive'] },
	{
		folderId: v.optional(v.nullable(misskeyId), null),
		name: v.optional(v.nullable(v.string()), null),
		comment: v.optional(v.nullable(jsonString({ maxLength: DB_MAX_IMAGE_COMMENT_LENGTH })), null),
		isSensitive: v.optional(v.boolean(), false),
		force: v.optional(v.boolean(), false),
	},
	driveFilesCreateOutput,
);
export const driveFilesCreateInput = driveFilesCreateDefinition.input;
export const driveFilesCreateWireInput = driveFilesCreateDefinition.wireInput;

export const driveFileCreateContracts = {
	'drive/files/create': driveFilesCreateDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof driveFileCreateContracts>;
type Outputs = InferContractRouterOutputs<typeof driveFileCreateContracts>;
export type NativeDriveFileCreateEndpoints = {
	[K in keyof typeof driveFileCreateContracts]: { req: Inputs[K]; res: Outputs[K] };
};
