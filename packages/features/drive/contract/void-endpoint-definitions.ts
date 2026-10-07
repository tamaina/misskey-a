/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';

export const voidAdminDeleteAllFilesOfAUserInput = v.looseObject({
	"userId": misskeyId,
});
export const voidAdminDeleteAllFilesOfAUserOutput = v.void();
export const voidAdminDeleteAllFilesOfAUserDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/delete-all-files-of-a-user", tags: ["admin"] },
	voidAdminDeleteAllFilesOfAUserInput,
	voidAdminDeleteAllFilesOfAUserOutput,
);

export const voidAdminDriveCleanRemoteFilesInput = v.looseObject({});
export const voidAdminDriveCleanRemoteFilesOutput = v.void();
export const voidAdminDriveCleanRemoteFilesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/drive/clean-remote-files", tags: ["admin"] },
	voidAdminDriveCleanRemoteFilesInput,
	voidAdminDriveCleanRemoteFilesOutput,
);

export const voidAdminDriveCleanupInput = v.looseObject({});
export const voidAdminDriveCleanupOutput = v.void();
export const voidAdminDriveCleanupDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/drive/cleanup", tags: ["admin"] },
	voidAdminDriveCleanupInput,
	voidAdminDriveCleanupOutput,
);

export const voidDriveFilesDeleteInput = v.looseObject({
	"fileId": misskeyId,
});
export const voidDriveFilesDeleteOutput = v.void();
export const voidDriveFilesDeleteDefinition = defineEndpointContract(
	{ method: 'POST', path: "/drive/files/delete", tags: ["drive"] },
	voidDriveFilesDeleteInput,
	voidDriveFilesDeleteOutput,
);

export const voidDriveFilesUploadFromUrlInput = v.looseObject({
	"url": v.string(),
	"folderId": v.optional(v.nullable(misskeyId), null),
	"isSensitive": v.optional(v.boolean(), false),
	"comment": v.optional(v.nullable(jsonString({ "maxLength": 512 })), null),
	"marker": v.optional(v.nullable(v.string()), null),
	"force": v.optional(v.boolean(), false),
});
export const voidDriveFilesUploadFromUrlOutput = v.void();
export const voidDriveFilesUploadFromUrlDefinition = defineEndpointContract(
	{ method: 'POST', path: "/drive/files/upload-from-url", tags: ["drive"] },
	voidDriveFilesUploadFromUrlInput,
	voidDriveFilesUploadFromUrlOutput,
);

export const voidDriveFoldersDeleteInput = v.looseObject({
	"folderId": misskeyId,
});
export const voidDriveFoldersDeleteOutput = v.void();
export const voidDriveFoldersDeleteDefinition = defineEndpointContract(
	{ method: 'POST', path: "/drive/folders/delete", tags: ["drive"] },
	voidDriveFoldersDeleteInput,
	voidDriveFoldersDeleteOutput,
);

export const voidEndpointDefinitions = {
	"admin/delete-all-files-of-a-user": voidAdminDeleteAllFilesOfAUserDefinition,
	"admin/drive/clean-remote-files": voidAdminDriveCleanRemoteFilesDefinition,
	"admin/drive/cleanup": voidAdminDriveCleanupDefinition,
	"drive/files/delete": voidDriveFilesDeleteDefinition,
	"drive/files/upload-from-url": voidDriveFilesUploadFromUrlDefinition,
	"drive/folders/delete": voidDriveFoldersDeleteDefinition,
} as const;

export const voidEndpointContracts = {
	"admin/delete-all-files-of-a-user": voidAdminDeleteAllFilesOfAUserDefinition.contract,
	"admin/drive/clean-remote-files": voidAdminDriveCleanRemoteFilesDefinition.contract,
	"admin/drive/cleanup": voidAdminDriveCleanupDefinition.contract,
	"drive/files/delete": voidDriveFilesDeleteDefinition.contract,
	"drive/files/upload-from-url": voidDriveFilesUploadFromUrlDefinition.contract,
	"drive/folders/delete": voidDriveFoldersDeleteDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof voidEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof voidEndpointContracts>;
export type NativeVoidEndpoints = {
	[K in keyof typeof voidEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
