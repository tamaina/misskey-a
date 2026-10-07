/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';
import { jsonObject } from '../../api/contract/json-object.js';
import { packedReference } from '../../api/contract/packed-reference.js';
import { systemWebhookEventTypes } from './system-webhook-events.js';

export const portableAdminSystemWebhookCreateInput = jsonObject({
	"isActive": v.boolean(),
	"name": jsonString({ "minLength": 1, "maxLength": 255 }),
	"on": v.array(v.picklist(systemWebhookEventTypes)),
	"url": jsonString({ "minLength": 1, "maxLength": 1024 }),
	"secret": v.optional(jsonString({ "maxLength": 1024 }), ""),
});
export const portableAdminSystemWebhookCreateOutput = packedReference("SystemWebhook");
export const portableAdminSystemWebhookCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/system-webhook/create", tags: ["admin", "system-webhook"] },
	portableAdminSystemWebhookCreateInput,
	portableAdminSystemWebhookCreateOutput,
);

export const portableAdminSystemWebhookListInput = jsonObject({
	"isActive": v.exactOptional(v.boolean()),
	"on": v.exactOptional(v.array(v.picklist(systemWebhookEventTypes))),
});
export const portableAdminSystemWebhookListOutput = v.array(packedReference("SystemWebhook"));
export const portableAdminSystemWebhookListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/system-webhook/list", tags: ["admin", "system-webhook"] },
	portableAdminSystemWebhookListInput,
	portableAdminSystemWebhookListOutput,
);

export const portableAdminSystemWebhookTestInput = jsonObject({
	"webhookId": misskeyId,
	"type": v.picklist(systemWebhookEventTypes),
	"override": v.exactOptional(v.pipe(jsonObject({
		"url": v.exactOptional(v.pipe(v.string(), v.metadata({ "nullable": false }))),
		"secret": v.exactOptional(v.pipe(v.string(), v.metadata({ "nullable": false }))),
	}), v.metadata({ "required": undefined }))),
});
export const portableAdminSystemWebhookTestOutput = v.void();
export const portableAdminSystemWebhookTestDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/system-webhook/test", tags: ["webhooks"] },
	portableAdminSystemWebhookTestInput,
	portableAdminSystemWebhookTestOutput,
);

export const portableAdminSystemWebhookUpdateInput = jsonObject({
	"id": misskeyId,
	"isActive": v.boolean(),
	"name": jsonString({ "minLength": 1, "maxLength": 255 }),
	"on": v.array(v.picklist(systemWebhookEventTypes)),
	"url": jsonString({ "minLength": 1, "maxLength": 1024 }),
	"secret": v.optional(jsonString({ "maxLength": 1024 }), ""),
});
export const portableAdminSystemWebhookUpdateOutput = packedReference("SystemWebhook");
export const portableAdminSystemWebhookUpdateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/system-webhook/update", tags: ["admin", "system-webhook"] },
	portableAdminSystemWebhookUpdateInput,
	portableAdminSystemWebhookUpdateOutput,
);

export const portableConstantEndpointDefinitions = {
	"admin/system-webhook/create": portableAdminSystemWebhookCreateDefinition,
	"admin/system-webhook/list": portableAdminSystemWebhookListDefinition,
	"admin/system-webhook/test": portableAdminSystemWebhookTestDefinition,
	"admin/system-webhook/update": portableAdminSystemWebhookUpdateDefinition,
} as const;

export const portableConstantEndpointContracts = {
	"admin/system-webhook/create": portableAdminSystemWebhookCreateDefinition.contract,
	"admin/system-webhook/list": portableAdminSystemWebhookListDefinition.contract,
	"admin/system-webhook/test": portableAdminSystemWebhookTestDefinition.contract,
	"admin/system-webhook/update": portableAdminSystemWebhookUpdateDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof portableConstantEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof portableConstantEndpointContracts>;
export type PortableConstantEndpoints = {
	[K in keyof typeof portableConstantEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
