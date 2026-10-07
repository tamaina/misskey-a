/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedAnnouncementsInput = v.object({
	"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
	"sinceId": v.exactOptional(misskeyId),
	"untilId": v.exactOptional(misskeyId),
	"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
	"isActive": v.optional(v.boolean(), true),
});
export const packedAnnouncementsOutput = v.array(packedReference("Announcement"));
export const packedAnnouncementsDefinition = defineEndpointContract(
	{ method: 'POST', path: "/announcements", tags: ["meta"] },
	packedAnnouncementsInput,
	packedAnnouncementsOutput,
);

export const packedAnnouncementsShowInput = v.object({
	"announcementId": misskeyId,
});
export const packedAnnouncementsShowOutput = packedReference("Announcement");
export const packedAnnouncementsShowDefinition = defineEndpointContract(
	{ method: 'POST', path: "/announcements/show", tags: ["meta"] },
	packedAnnouncementsShowInput,
	packedAnnouncementsShowOutput,
);

export const packedEndpointDefinitions = {
	"announcements": packedAnnouncementsDefinition,
	"announcements/show": packedAnnouncementsShowDefinition,
} as const;

export const packedEndpointContracts = {
	"announcements": packedAnnouncementsDefinition.contract,
	"announcements/show": packedAnnouncementsShowDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
