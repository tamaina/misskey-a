/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { notificationListInput } from './notification-input.schema.js';
import { packedNotificationSchema } from '../../notification.schema.js';

export const listInput = notificationListInput;
export const listOutput = v.array(packedNotificationSchema);
const requestName = 'i/notifications';
export const listContract = oc.$meta<{ requestName: typeof requestName }>({ requestName })
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['account', 'notifications'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), })
	.errors(commonErrors)
	.input(listInput)
	.output(listOutput);
