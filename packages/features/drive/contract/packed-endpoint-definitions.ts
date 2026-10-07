/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedDriveFilesAttachedChatMessagesInput = v.object({
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"fileId": misskeyId,
});
export const packedDriveFilesAttachedChatMessagesOutput = v.array(packedReference("ChatMessage"));
export const packedDriveFilesAttachedChatMessagesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/drive/files/attached-chat-messages", tags: ["drive", "chat"] },
	packedDriveFilesAttachedChatMessagesInput,
	packedDriveFilesAttachedChatMessagesOutput,
);

export const packedDriveFilesAttachedNotesInput = v.object({
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"fileId": misskeyId,
});
export const packedDriveFilesAttachedNotesOutput = v.array(packedReference("Note"));
export const packedDriveFilesAttachedNotesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/drive/files/attached-notes", tags: ["drive", "notes"] },
	packedDriveFilesAttachedNotesInput,
	packedDriveFilesAttachedNotesOutput,
);

export const packedDriveFilesFindInput = v.object({
	"name": v.string(),
	"folderId": v.optional(v.nullable(misskeyId), null),
});
export const packedDriveFilesFindOutput = v.array(packedReference("DriveFile"));
export const packedDriveFilesFindDefinition = defineEndpointContract(
	{ method: 'POST', path: "/drive/files/find", tags: ["drive"] },
	packedDriveFilesFindInput,
	packedDriveFilesFindOutput,
);

export const packedDriveFilesFindByHashInput = v.object({
	"md5": v.string(),
});
export const packedDriveFilesFindByHashOutput = v.array(packedReference("DriveFile"));
export const packedDriveFilesFindByHashDefinition = defineEndpointContract(
	{ method: 'POST', path: "/drive/files/find-by-hash", tags: ["drive"] },
	packedDriveFilesFindByHashInput,
	packedDriveFilesFindByHashOutput,
);

export const packedDriveFilesUpdateInput = v.object({
	"fileId": misskeyId,
	"folderId": v.exactOptional(v.nullable(misskeyId)),
	"name": v.exactOptional(v.string()),
	"isSensitive": v.exactOptional(v.boolean()),
	"comment": v.exactOptional(v.nullable(jsonString({ "maxLength": 512 }))),
});
export const packedDriveFilesUpdateOutput = packedReference("DriveFile");
export const packedDriveFilesUpdateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/drive/files/update", tags: ["drive"] },
	packedDriveFilesUpdateInput,
	packedDriveFilesUpdateOutput,
);

export const packedDriveFoldersInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"folderId": v.optional(v.nullable(misskeyId), null),
});
export const packedDriveFoldersOutput = v.array(packedReference("DriveFolder"));
export const packedDriveFoldersDefinition = defineEndpointContract(
	{ method: 'POST', path: "/drive/folders", tags: ["drive"] },
	packedDriveFoldersInput,
	packedDriveFoldersOutput,
);

export const packedDriveFoldersCreateInput = v.object({
	"name": v.optional(jsonString({ "maxLength": 200 }), "Untitled"),
	"parentId": v.exactOptional(v.nullable(misskeyId)),
});
export const packedDriveFoldersCreateOutput = packedReference("DriveFolder");
export const packedDriveFoldersCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/drive/folders/create", tags: ["drive"] },
	packedDriveFoldersCreateInput,
	packedDriveFoldersCreateOutput,
);

export const packedDriveFoldersFindInput = v.object({
	"name": v.string(),
	"parentId": v.optional(v.nullable(misskeyId), null),
});
export const packedDriveFoldersFindOutput = v.array(packedReference("DriveFolder"));
export const packedDriveFoldersFindDefinition = defineEndpointContract(
	{ method: 'POST', path: "/drive/folders/find", tags: ["drive"] },
	packedDriveFoldersFindInput,
	packedDriveFoldersFindOutput,
);

export const packedDriveFoldersShowInput = v.object({
	"folderId": misskeyId,
});
export const packedDriveFoldersShowOutput = packedReference("DriveFolder");
export const packedDriveFoldersShowDefinition = defineEndpointContract(
	{ method: 'POST', path: "/drive/folders/show", tags: ["drive"] },
	packedDriveFoldersShowInput,
	packedDriveFoldersShowOutput,
);

export const packedDriveFoldersUpdateInput = v.object({
	"folderId": misskeyId,
	"name": v.exactOptional(jsonString({ "maxLength": 200 })),
	"parentId": v.exactOptional(v.nullable(misskeyId)),
});
export const packedDriveFoldersUpdateOutput = packedReference("DriveFolder");
export const packedDriveFoldersUpdateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/drive/folders/update", tags: ["drive"] },
	packedDriveFoldersUpdateInput,
	packedDriveFoldersUpdateOutput,
);

export const packedEndpointDefinitions = {
	"drive/files/attached-chat-messages": packedDriveFilesAttachedChatMessagesDefinition,
	"drive/files/attached-notes": packedDriveFilesAttachedNotesDefinition,
	"drive/files/find": packedDriveFilesFindDefinition,
	"drive/files/find-by-hash": packedDriveFilesFindByHashDefinition,
	"drive/files/update": packedDriveFilesUpdateDefinition,
	"drive/folders": packedDriveFoldersDefinition,
	"drive/folders/create": packedDriveFoldersCreateDefinition,
	"drive/folders/find": packedDriveFoldersFindDefinition,
	"drive/folders/show": packedDriveFoldersShowDefinition,
	"drive/folders/update": packedDriveFoldersUpdateDefinition,
} as const;

export const packedEndpointContracts = {
	"drive/files/attached-chat-messages": packedDriveFilesAttachedChatMessagesDefinition.contract,
	"drive/files/attached-notes": packedDriveFilesAttachedNotesDefinition.contract,
	"drive/files/find": packedDriveFilesFindDefinition.contract,
	"drive/files/find-by-hash": packedDriveFilesFindByHashDefinition.contract,
	"drive/files/update": packedDriveFilesUpdateDefinition.contract,
	"drive/folders": packedDriveFoldersDefinition.contract,
	"drive/folders/create": packedDriveFoldersCreateDefinition.contract,
	"drive/folders/find": packedDriveFoldersFindDefinition.contract,
	"drive/folders/show": packedDriveFoldersShowDefinition.contract,
	"drive/folders/update": packedDriveFoldersUpdateDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
