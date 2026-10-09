/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { finiteNumber } from '../../../queue.schema.js';

export const adminQueueInboxDelayedErrors = {} as const;

const requestName = 'admin/queue/inbox-delayed';
export const adminQueueInboxDelayedContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({})).output(v.array(v.tuple([v.string(), finiteNumber])));

export type AdminQueueInboxDelayedInput = v.InferOutput<NonNullable<typeof adminQueueInboxDelayedContract['~orpc']['inputSchema']>>;
export type AdminQueueInboxDelayedOutput = v.InferOutput<NonNullable<typeof adminQueueInboxDelayedContract['~orpc']['outputSchema']>>;
