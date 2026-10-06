/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import type { InferContractRouterInputs, InferContractRouterOutputs } from '@orpc/contract';
import * as v from 'valibot';
import { QUEUE_TYPES } from '../../runtime/shared/queue-types.js';

export const QUEUE_CLEAR_STATES = ['*', 'completed', 'wait', 'active', 'paused', 'prioritized', 'delayed', 'failed'] as const;

const queueInput = v.picklist(QUEUE_TYPES);
const queueStateInput = v.picklist(QUEUE_CLEAR_STATES);
const voidOutput = v.void();

export const operationsInputs = {
	'admin/queue/pause': v.looseObject({ queue: queueInput }),
	'admin/queue/resume': v.looseObject({ queue: queueInput }),
	'admin/queue/clear': v.looseObject({ queue: queueInput, state: queueStateInput }),
	'admin/queue/promote-jobs': v.looseObject({ queue: queueInput }),
	'admin/queue/retry-job': v.looseObject({ queue: queueInput, jobId: v.string() }),
	'admin/queue/remove-job': v.looseObject({ queue: queueInput, jobId: v.string() }),
};

export const operationsContract = {
	'admin/queue/pause': oc.route({ method: 'POST', path: '/admin/queue/pause', tags: ['admin'] })
		.input(operationsInputs['admin/queue/pause'])
		.output(voidOutput),
	'admin/queue/resume': oc.route({ method: 'POST', path: '/admin/queue/resume', tags: ['admin'] })
		.input(operationsInputs['admin/queue/resume'])
		.output(voidOutput),
	'admin/queue/clear': oc.route({ method: 'POST', path: '/admin/queue/clear', tags: ['admin'] })
		.input(operationsInputs['admin/queue/clear'])
		.output(voidOutput),
	'admin/queue/promote-jobs': oc.route({ method: 'POST', path: '/admin/queue/promote-jobs', tags: ['admin'] })
		.input(operationsInputs['admin/queue/promote-jobs'])
		.output(voidOutput),
	'admin/queue/retry-job': oc.route({ method: 'POST', path: '/admin/queue/retry-job', tags: ['admin'] })
		.input(operationsInputs['admin/queue/retry-job'])
		.output(voidOutput),
	'admin/queue/remove-job': oc.route({ method: 'POST', path: '/admin/queue/remove-job', tags: ['admin'] })
		.input(operationsInputs['admin/queue/remove-job'])
		.output(voidOutput),
};

type Inputs = InferContractRouterInputs<typeof operationsContract>;
type Outputs = InferContractRouterOutputs<typeof operationsContract>;
export type OperationsEndpoints = {
	[K in keyof typeof operationsContract]: { req: Inputs[K]; res: Outputs[K] };
};
