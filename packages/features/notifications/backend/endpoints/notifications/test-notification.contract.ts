/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
const emptyInput = v.optional(v.lazy(input => Array.isArray(input) ? v.never() : objectInput({})), {});

export const testNotificationInput = emptyInput;
export const testNotificationOutput = v.void();
const requestName = 'notifications/test-notification';
export const testNotificationContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['notifications'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204, })
	.errors(commonErrors)
	.input(testNotificationInput)
	.output(testNotificationOutput);
