/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { misskeyId, objectParams } from '../../api/contract/index.js';
import { packedReference } from '../../api/contract/packed-reference.js';
import { resultObject } from '../../api/contract/result-object.js';

export const selectorAdminDriveShowFileInput = v.union([
	jsonObject({
		fileId: misskeyId,
	}),
	jsonObject({
		url: v.string(),
	}),
]);
export const selectorAdminDriveShowFileOutput = resultObject({
	id: v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	createdAt: v.pipe(v.string(), v.metadata({ "format": "date-time" })),
	userId: v.pipe(v.nullable(v.string()), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	userHost: v.pipe(v.nullable(v.string()), v.metadata({ "description": "The local host is represented with `null`." })),
	md5: v.pipe(v.string(), v.metadata({ "format": "md5", "example": "15eca7fba0480996e2245f5185bf39f2" })),
	name: v.pipe(v.string(), v.metadata({ "example": "192.jpg" })),
	type: v.pipe(v.string(), v.metadata({ "example": "image/jpeg" })),
	size: v.pipe(v.number(), v.metadata({ "example": 51469 })),
	comment: v.nullable(v.string()),
	blurhash: v.nullable(v.string()),
	properties: resultObject({
		width: v.exactOptional(v.number()),
		height: v.exactOptional(v.number()),
		orientation: v.exactOptional(v.number()),
		avgColor: v.exactOptional(v.string()),
	}),
	storedInternal: v.pipe(v.nullable(v.boolean()), v.metadata({ "example": true })),
	url: v.pipe(v.nullable(v.string()), v.metadata({ "format": "url" })),
	thumbnailUrl: v.pipe(v.nullable(v.string()), v.metadata({ "format": "url" })),
	webpublicUrl: v.pipe(v.nullable(v.string()), v.metadata({ "format": "url" })),
	accessKey: v.nullable(v.string()),
	thumbnailAccessKey: v.nullable(v.string()),
	webpublicAccessKey: v.nullable(v.string()),
	uri: v.nullable(v.string()),
	src: v.nullable(v.string()),
	folderId: v.pipe(v.nullable(v.string()), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
	isSensitive: v.boolean(),
	isLink: v.boolean(),
	maybeSensitive: v.boolean(),
	maybePorn: v.boolean(),
	requestIp: v.nullable(v.string()),
	// Omit an explicit allow-all flag to retain the legacy opaque-object documentation.
	requestHeaders: v.pipe(v.nullable(objectParams), v.metadata({ additionalProperties: undefined })),
});
export const selectorAdminDriveShowFileDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/drive/show-file', tags: ["admin"] },
	selectorAdminDriveShowFileInput,
	selectorAdminDriveShowFileOutput,
);

export const selectorDriveFilesShowInput = v.union([
	jsonObject({
		fileId: misskeyId,
	}),
	jsonObject({
		url: v.string(),
	}),
]);
export const selectorDriveFilesShowOutput = packedReference('DriveFile');
export const selectorDriveFilesShowDefinition = defineEndpointContract(
	{ method: 'POST', path: '/drive/files/show', tags: ["drive"] },
	selectorDriveFilesShowInput,
	selectorDriveFilesShowOutput,
);

export const selectorEndpointDefinitions = {
	'admin/drive/show-file': selectorAdminDriveShowFileDefinition,
	'drive/files/show': selectorDriveFilesShowDefinition,
} as const;

export const selectorEndpointContracts = {
	'admin/drive/show-file': selectorAdminDriveShowFileDefinition.contract,
	'drive/files/show': selectorDriveFilesShowDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof selectorEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof selectorEndpointContracts>;
export type SelectorEndpoints = {
	[K in keyof typeof selectorEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
