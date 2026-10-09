/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { QUEUE_TYPES } from '../../../queue.schema.js';
import { QUEUE_CLEAR_STATES } from '../../../queue.schema.js';

export const adminQueueClearInput = objectInput({ queue: v.picklist(QUEUE_TYPES), state: v.picklist(QUEUE_CLEAR_STATES) });
export const adminQueueClearOutput = v.void();
export const adminQueueClearErrors = {} as const;

const requestName = 'admin/queue/clear';
export const adminQueueClearContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(adminQueueClearInput).output(adminQueueClearOutput);
