/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { jsonObject } from '../../api/contract/json-object.js';
import { defineEndpointContract } from '../../api/contract/definition.js';
import { jsonString, misskeyId } from '../../api/contract/index.js';
import { resultObject } from '../../api/contract/result-object.js';
import { webhookEventTypes } from './index.js';

export const constantIWebhooksCreateInput = jsonObject({
	"name": jsonString({ "minLength": 1, "maxLength": 100 }),
	"url": jsonString({ "minLength": 1, "maxLength": 1024 }),
	"secret": v.optional(jsonString({ "maxLength": 1024 }), ""),
	"on": v.array(v.picklist(webhookEventTypes)),
});
export const constantIWebhooksCreateOutput = resultObject({
	"id": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
	"userId": v.pipe(v.string(), v.metadata({ "format": "misskey:id" })),
	"name": v.string(),
	"on": v.array(v.picklist(webhookEventTypes)),
	"url": v.string(),
	"secret": v.string(),
	"active": v.boolean(),
	"latestSentAt": v.pipe(v.nullable(v.string()), v.metadata({ "format": "date-time" })),
	"latestStatus": v.nullable(v.pipe(v.number(), v.integer())),
});
export const constantIWebhooksCreateDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/webhooks/create", tags: ["webhooks"] },
	constantIWebhooksCreateInput,
	constantIWebhooksCreateOutput,
);

export const constantIWebhooksTestInput = jsonObject({
	"webhookId": misskeyId,
	"type": v.picklist(webhookEventTypes),
	"override": v.exactOptional(v.pipe(jsonObject({
		"url": v.exactOptional(v.string()),
		"secret": v.exactOptional(v.string()),
	}), v.metadata({ "required": undefined }))),
});
export const constantIWebhooksTestOutput = v.void();
export const constantIWebhooksTestDefinition = defineEndpointContract(
	{ method: 'POST', path: "/i/webhooks/test", tags: ["webhooks"] },
	constantIWebhooksTestInput,
	constantIWebhooksTestOutput,
);

export const sourceConstantEndpointDefinitions = {
	"i/webhooks/create": constantIWebhooksCreateDefinition,
	"i/webhooks/test": constantIWebhooksTestDefinition,
} as const;

export const sourceConstantEndpointContracts = {
	"i/webhooks/create": constantIWebhooksCreateDefinition.contract,
	"i/webhooks/test": constantIWebhooksTestDefinition.contract,
} as const;

type Inputs = InferContractRouterInputs<typeof sourceConstantEndpointContracts>;
type Outputs = InferContractRouterOutputs<typeof sourceConstantEndpointContracts>;
export type SourceConstantEndpoints = {
	[K in keyof typeof sourceConstantEndpointContracts]: { req: Inputs[K]; res: Outputs[K] };
};
