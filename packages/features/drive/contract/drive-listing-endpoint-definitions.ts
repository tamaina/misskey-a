/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { packedReference } from '../../api/contract/packed-reference.js';
import { misskeyId } from '../../api/contract/index.js';

// Nullable sort keeps null in its legacy enum because AJV checks enum separately.

export const listingAdminDriveFilesInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"userId": v.exactOptional(v.nullable(misskeyId)),
	"type": v.exactOptional(v.nullable(v.pipe(v.string(), v.regex(new RegExp("^[a-zA-Z0-9\\/\\-*]+$"))))),
	"origin": v.optional(v.picklist(["combined", "local", "remote"]), "local"),
	"hostname": v.optional(v.pipe(v.nullable(v.string()), v.metadata({ "description": "The local host is represented with `null`." })), null),
});
export const listingAdminDriveFilesOutput = v.array(packedReference("DriveFile"));
export const listingAdminDriveFilesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/drive/files", tags: ["admin"] },
	listingAdminDriveFilesInput,
	listingAdminDriveFilesOutput,
);

export const listingDriveFilesInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"folderId": v.optional(v.nullable(misskeyId), null),
	"type": v.exactOptional(v.nullable(v.pipe(v.string(), v.regex(new RegExp("^[a-zA-Z\\/\\-*]+$"))))),
	"sort": v.exactOptional(v.pipe(v.nullable(v.picklist(["+createdAt", "-createdAt", "+name", "-name", "+size", "-size"])), v.metadata({ "enum": ["+createdAt", "-createdAt", "+name", "-name", "+size", "-size", null] }))),
});
export const listingDriveFilesOutput = v.array(packedReference("DriveFile"));
export const listingDriveFilesDefinition = defineEndpointContract(
	{ method: 'POST', path: "/drive/files", tags: ["drive"] },
	listingDriveFilesInput,
	listingDriveFilesOutput,
);

export const listingDriveStreamInput = v.looseObject({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"type": v.exactOptional(v.pipe(v.string(), v.regex(new RegExp("^[a-zA-Z\\/\\-*]+$")))),
});
export const listingDriveStreamOutput = v.array(packedReference("DriveFile"));
export const listingDriveStreamDefinition = defineEndpointContract(
	{ method: 'POST', path: "/drive/stream", tags: ["drive"] },
	listingDriveStreamInput,
	listingDriveStreamOutput,
);

export const driveListingEndpointDefinitions = {
	"admin/drive/files": listingAdminDriveFilesDefinition,
	"drive/files": listingDriveFilesDefinition,
	"drive/stream": listingDriveStreamDefinition,
} as const;

export const driveListingEndpointContracts = {
	"admin/drive/files": listingAdminDriveFilesDefinition.contract,
	"drive/files": listingDriveFilesDefinition.contract,
	"drive/stream": listingDriveStreamDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof driveListingEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof driveListingEndpointContracts>;
export type NativeDriveListingEndpoints = {
	[K in keyof typeof driveListingEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
