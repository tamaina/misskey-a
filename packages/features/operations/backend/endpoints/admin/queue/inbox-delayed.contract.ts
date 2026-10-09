/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { finiteNumber } from '../../../queue.schema.js';

export const adminQueueInboxDelayedInput = objectInput({});
export const adminQueueInboxDelayedOutput = v.array(v.tuple([v.string(), finiteNumber]));
export const adminQueueInboxDelayedErrors = {} as const;

const requestName = 'admin/queue/inbox-delayed';
export const adminQueueInboxDelayedContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors })
	.input(adminQueueInboxDelayedInput).output(adminQueueInboxDelayedOutput);
