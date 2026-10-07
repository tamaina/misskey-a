/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { misskeyId } from '../../api/contract/index.js';

export const voidAdminSendEmailInput = v.looseObject({
	"to": v.string(),
	"subject": v.string(),
	"text": v.string(),
});
export const voidAdminSendEmailOutput = v.void();
export const voidAdminSendEmailDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/send-email", tags: ["admin"] },
	voidAdminSendEmailInput,
	voidAdminSendEmailOutput,
);

export const voidAdminSystemWebhookDeleteInput = v.looseObject({
	"id": misskeyId,
});
export const voidAdminSystemWebhookDeleteOutput = v.void();
export const voidAdminSystemWebhookDeleteDefinition = defineEndpointContract(
	{ method: 'POST', path: "/admin/system-webhook/delete", tags: ["admin", "system-webhook"] },
	voidAdminSystemWebhookDeleteInput,
	voidAdminSystemWebhookDeleteOutput,
);

export const voidEndpointDefinitions = {
	"admin/send-email": voidAdminSendEmailDefinition,
	"admin/system-webhook/delete": voidAdminSystemWebhookDeleteDefinition,
} as const;

export const voidEndpointContracts = {
	"admin/send-email": voidAdminSendEmailDefinition.contract,
	"admin/system-webhook/delete": voidAdminSystemWebhookDeleteDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof voidEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof voidEndpointContracts>;
export type NativeVoidEndpoints = {
	[K in keyof typeof voidEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
