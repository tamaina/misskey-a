/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { objectParams } from '../../api/contract/index.js';

export const notificationsInputs = {
	'notifications/create': v.object({
		body: v.string(),
		header: v.exactOptional(v.nullable(v.string())),
		icon: v.exactOptional(v.nullable(v.string())),
	}),
	'notifications/flush': objectParams,
	'notifications/mark-all-as-read': objectParams,
	'notifications/test-notification': objectParams,
};

const voidOutput = v.void();

export const notificationsContract = {
	'notifications/create': oc.route({ method: 'POST', path: '/notifications/create', tags: ['notifications'] })
		.input(notificationsInputs['notifications/create'])
		.output(voidOutput),
	'notifications/flush': oc.route({ method: 'POST', path: '/notifications/flush', tags: ['notifications', 'account'] })
		.input(notificationsInputs['notifications/flush'])
		.output(voidOutput),
	'notifications/mark-all-as-read': oc.route({ method: 'POST', path: '/notifications/mark-all-as-read', tags: ['notifications', 'account'] })
		.input(notificationsInputs['notifications/mark-all-as-read'])
		.output(voidOutput),
	'notifications/test-notification': oc.route({ method: 'POST', path: '/notifications/test-notification', tags: ['notifications'] })
		.input(notificationsInputs['notifications/test-notification'])
		.output(voidOutput),
};

type Inputs = InferContractRouterInputs<typeof notificationsContract>;
type Outputs = InferContractRouterOutputs<typeof notificationsContract>;
export type NotificationsEndpoints = {
	[K in keyof typeof notificationsContract]: { req: Inputs[K]; res: Outputs[K] };
};
