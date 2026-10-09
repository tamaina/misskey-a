/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { finiteNumber } from '../../../queue.schema.js';

export const adminQueueDeliverDelayedErrors = {} as const;

const requestName = 'admin/queue/deliver-delayed';
export const adminQueueDeliverDelayedContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({})).output(v.array(v.tuple([v.string(), finiteNumber])));

export type AdminQueueDeliverDelayedInput = v.InferOutput<NonNullable<typeof adminQueueDeliverDelayedContract['~orpc']['inputSchema']>>;
export type AdminQueueDeliverDelayedOutput = v.InferOutput<NonNullable<typeof adminQueueDeliverDelayedContract['~orpc']['outputSchema']>>;
