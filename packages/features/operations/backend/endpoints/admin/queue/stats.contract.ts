/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { queueCounterSchema } from '../../../queue.schema.js';

export const adminQueueStatsInput = objectInput({});
export const adminQueueStatsOutput = v.strictObject({ deliver: queueCounterSchema, inbox: queueCounterSchema, db: queueCounterSchema, objectStorage: queueCounterSchema });
export const adminQueueStatsErrors = {} as const;

const requestName = 'admin/queue/stats';
export const adminQueueStatsContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(adminQueueStatsInput).output(adminQueueStatsOutput);
