/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { finiteNumber } from '../../../queue.schema.js';

export const adminQueueDeliverDelayedInput = objectInput({});
export const adminQueueDeliverDelayedOutput = v.array(v.tuple([v.string(), finiteNumber]));
export const adminQueueDeliverDelayedErrors = {} as const;

const requestName = 'admin/queue/deliver-delayed';
export const adminQueueDeliverDelayedContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(adminQueueDeliverDelayedInput).output(adminQueueDeliverDelayedOutput);
