/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';
import { packedReference } from '../../api/contract/packed-reference.js';

export const packedAdminSystemWebhookShowInput = v.object({
	"id": misskeyId,
});
export const packedAdminSystemWebhookShowOutput = packedReference("SystemWebhook");
export const packedAdminSystemWebhookShowDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/system-webhook/show", tags: ["admin", "system-webhook"] },
	packedAdminSystemWebhookShowInput,
	packedAdminSystemWebhookShowOutput,
);

export const packedIWebhooksListInput = v.object({});
export const packedIWebhooksListOutput = v.array(packedReference("UserWebhook"));
export const packedIWebhooksListDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/webhooks/list", tags: ["webhooks", "account"] },
	packedIWebhooksListInput,
	packedIWebhooksListOutput,
);

export const packedIWebhooksShowInput = v.object({
	"webhookId": misskeyId,
});
export const packedIWebhooksShowOutput = packedReference("UserWebhook");
export const packedIWebhooksShowDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/webhooks/show", tags: ["webhooks"] },
	packedIWebhooksShowInput,
	packedIWebhooksShowOutput,
);

export const packedEndpointDefinitions = {
	"admin/system-webhook/show": packedAdminSystemWebhookShowDefinition,
	"i/webhooks/list": packedIWebhooksListDefinition,
	"i/webhooks/show": packedIWebhooksShowDefinition,
} as const;

export const packedEndpointContracts = {
	"admin/system-webhook/show": packedAdminSystemWebhookShowDefinition.contract,
	"i/webhooks/list": packedIWebhooksListDefinition.contract,
	"i/webhooks/show": packedIWebhooksShowDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof packedEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof packedEndpointContracts>;
export type PackedNativeEndpoints = {
	[K in keyof typeof packedEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
