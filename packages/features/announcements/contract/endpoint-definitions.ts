/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';
import { packedAnnouncementSchema } from './packed.js';

export const inlineAdminAnnouncementsCreateInput = v.object({
	"title": jsonString({ "minLength": 1 }),
	"text": jsonString({ "minLength": 1 }),
	"imageUrl": v.nullable(jsonString({ "minLength": 0 })),
	"icon": v.optional(v.picklist(["info", "warning", "error", "success"]), "info"),
	"display": v.optional(v.picklist(["normal", "banner", "dialog"]), "normal"),
	"forExistingUsers": v.optional(v.boolean(), false),
	"silence": v.optional(v.boolean(), false),
	"needConfirmationToRead": v.optional(v.boolean(), false),
	"userId": v.optional(v.nullable(misskeyId), null),
});
// Creation returns the full public serializer result, including its optional read state.
export const inlineAdminAnnouncementsCreateOutput = v.strictObject(packedAnnouncementSchema.entries);
export const inlineAdminAnnouncementsCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/announcements/create', tags: ["admin"] },
	inlineAdminAnnouncementsCreateInput,
	inlineAdminAnnouncementsCreateOutput,
);

export const inlineAdminAnnouncementsListInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"userId": v.exactOptional(v.nullable(misskeyId)),
	"status": v.optional(v.picklist(["all", "active", "archived"]), "active"),
});
export const inlineAdminAnnouncementsListOutput = v.array(v.strictObject({
		"id": v.pipe(v.string(), v.metadata({ "format": "id", "example": "xxxxxxxxxx" })),
		"createdAt": v.pipe(v.string(), v.metadata({ "format": "date-time" })),
		"updatedAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
		"text": v.string(),
		"title": v.string(),
		"icon": v.picklist(["info", "warning", "error", "success"]),
		"display": v.picklist(["normal", "banner", "dialog"]),
		"isActive": v.boolean(),
		"forExistingUsers": v.boolean(),
		"silence": v.boolean(),
		"needConfirmationToRead": v.boolean(),
		"userId": v.nullable(v.string()),
		"imageUrl": v.nullable(v.string()),
		"reads": v.number(),
	}));
export const inlineAdminAnnouncementsListDefinition = defineEndpointContract(
	{ method: 'POST', path: '/admin/announcements/list', tags: ["admin"] },
	inlineAdminAnnouncementsListInput,
	inlineAdminAnnouncementsListOutput,
);

export const inlineEndpointDefinitions = {
	"admin/announcements/create": inlineAdminAnnouncementsCreateDefinition,
	"admin/announcements/list": inlineAdminAnnouncementsListDefinition,
} as const;

export const inlineEndpointContracts = {
	"admin/announcements/create": inlineAdminAnnouncementsCreateDefinition.contract,
	"admin/announcements/list": inlineAdminAnnouncementsListDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof inlineEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof inlineEndpointContracts>;
export type NativeInlineEndpoints = {
	[K in keyof typeof inlineEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
