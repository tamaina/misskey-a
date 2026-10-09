/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { QUEUE_TYPES } from '../../../queue.schema.js';
import { queueJobSchema } from '../../../queue.schema.js';

export const adminQueueShowJobInput = objectInput({
	"queue": v.picklist(QUEUE_TYPES),
	"jobId": v.string(),
});
export const adminQueueShowJobOutput = queueJobSchema;
export const adminQueueShowJobErrors = {} as const;

const requestName = 'admin/queue/show-job';
export const adminQueueShowJobContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(adminQueueShowJobInput).output(adminQueueShowJobOutput);
