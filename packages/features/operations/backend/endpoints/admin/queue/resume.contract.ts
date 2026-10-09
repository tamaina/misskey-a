/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { QUEUE_TYPES } from '../../../queue.schema.js';

export const adminQueueResumeErrors = {} as const;

const requestName = 'admin/queue/resume';
export const adminQueueResumeContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(objectInput({ queue: v.picklist(QUEUE_TYPES) })).output(v.void());

export type AdminQueueResumeInput = v.InferOutput<NonNullable<typeof adminQueueResumeContract['~orpc']['inputSchema']>>;
export type AdminQueueResumeOutput = v.InferOutput<NonNullable<typeof adminQueueResumeContract['~orpc']['outputSchema']>>;
