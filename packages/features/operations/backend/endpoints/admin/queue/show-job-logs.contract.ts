/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { QUEUE_TYPES } from '../../../queue.schema.js';

export const adminQueueShowJobLogsInput = objectInput({
	"queue": v.picklist(QUEUE_TYPES),
	"jobId": v.string(),
});
export const adminQueueShowJobLogsOutput = v.array(v.string());
export const adminQueueShowJobLogsErrors = {} as const;

const requestName = 'admin/queue/show-job-logs';
export const adminQueueShowJobLogsContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(adminQueueShowJobLogsInput).output(adminQueueShowJobLogsOutput);
