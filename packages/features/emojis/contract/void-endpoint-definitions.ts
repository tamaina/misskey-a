/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';

export const voidAdminEmojiDeleteInput = v.object({
	"id": misskeyId,
});
export const voidAdminEmojiDeleteOutput = v.void();
export const voidAdminEmojiDeleteDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/emoji/delete", tags: ["admin"] },
	voidAdminEmojiDeleteInput,
	voidAdminEmojiDeleteOutput,
);

export const voidAdminEmojiDeleteBulkInput = v.object({
	"ids": v.array(misskeyId),
});
export const voidAdminEmojiDeleteBulkOutput = v.void();
export const voidAdminEmojiDeleteBulkDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/emoji/delete-bulk", tags: ["admin"] },
	voidAdminEmojiDeleteBulkInput,
	voidAdminEmojiDeleteBulkOutput,
);

export const voidAdminEmojiImportZipInput = v.object({
	"fileId": misskeyId,
});
export const voidAdminEmojiImportZipOutput = v.void();
export const voidAdminEmojiImportZipDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/emoji/import-zip" },
	voidAdminEmojiImportZipInput,
	voidAdminEmojiImportZipOutput,
);

export const voidExportCustomEmojisInput = v.object({});
export const voidExportCustomEmojisOutput = v.void();
export const voidExportCustomEmojisDefinition = defineEndpointContract(
	{ method: 'POST', path: "/export-custom-emojis" },
	voidExportCustomEmojisInput,
	voidExportCustomEmojisOutput,
);

export const voidEndpointDefinitions = {
	"admin/emoji/delete": voidAdminEmojiDeleteDefinition,
	"admin/emoji/delete-bulk": voidAdminEmojiDeleteBulkDefinition,
	"admin/emoji/import-zip": voidAdminEmojiImportZipDefinition,
	"export-custom-emojis": voidExportCustomEmojisDefinition,
} as const;

export const voidEndpointContracts = {
	"admin/emoji/delete": voidAdminEmojiDeleteDefinition.contract,
	"admin/emoji/delete-bulk": voidAdminEmojiDeleteBulkDefinition.contract,
	"admin/emoji/import-zip": voidAdminEmojiImportZipDefinition.contract,
	"export-custom-emojis": voidExportCustomEmojisDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof voidEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof voidEndpointContracts>;
export type NativeVoidEndpoints = {
	[K in keyof typeof voidEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
