/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { jsonString, misskeyId } from '../../api/contract/index.js';

export const webhookEventTypes = ['mention', 'unfollow', 'follow', 'followed', 'note', 'reply', 'renote', 'reaction'] as const;
export type WebhookEventTypes = typeof webhookEventTypes[number];

const webhookEventTypeInput = v.picklist(webhookEventTypes);
const voidOutput = v.void();

export const webhookInputs = {
	'i/webhooks/update': v.object({
		webhookId: misskeyId,
		name: v.exactOptional(jsonString({ minLength: 1, maxLength: 100 })),
		url: v.exactOptional(jsonString({ minLength: 1, maxLength: 1024 })),
		secret: v.exactOptional(v.nullable(jsonString({ maxLength: 1024 }))),
		on: v.exactOptional(v.array(webhookEventTypeInput)),
		active: v.exactOptional(v.boolean()),
	}),
	'i/webhooks/delete': v.object({
		webhookId: misskeyId,
	}),
};

export const webhookErrors = {
	'i/webhooks/update': {
		noSuchWebhook: {
			message: 'No such webhook.',
			code: 'NO_SUCH_WEBHOOK',
			id: 'fb0fea69-da18-45b1-828d-bd4fd1612518',
		},
	},
	'i/webhooks/delete': {
		noSuchWebhook: {
			message: 'No such webhook.',
			code: 'NO_SUCH_WEBHOOK',
			id: 'bae73e5a-5522-4965-ae19-3a8688e71d82',
		},
	},
} as const;

export const webhookContract = {
	'i/webhooks/update': oc.route({ method: 'POST', path: '/i/webhooks/update', tags: ['webhooks', 'account'] })
		.input(webhookInputs['i/webhooks/update'])
		.output(voidOutput),
	'i/webhooks/delete': oc.route({ method: 'POST', path: '/i/webhooks/delete', tags: ['webhooks', 'account'] })
		.input(webhookInputs['i/webhooks/delete'])
		.output(voidOutput),
};

type Inputs = InferContractRouterInputs<typeof webhookContract>;
type Outputs = InferContractRouterOutputs<typeof webhookContract>;
export type WebhookEndpoints = {
	[K in keyof typeof webhookContract]: { req: Inputs[K]; res: Outputs[K] };
};
