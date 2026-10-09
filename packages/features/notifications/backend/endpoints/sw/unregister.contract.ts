/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';

const requestName = 'sw/unregister';
export const unregisterContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['account'], description: 'Unregister from receiving push notifications.', successStatus: 204 })
	.errors(commonErrors)
	.input(objectInput({ endpoint: v.string(), auth: v.string(), publickey: v.string() }))
	.output(v.void());
