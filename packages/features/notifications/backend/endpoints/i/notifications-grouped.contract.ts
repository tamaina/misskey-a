/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { packedNotificationSchema } from '../../notification.schema.js';
import { notificationListInput } from './notification-input.schema.js';

const requestName = 'i/notifications-grouped';
export const groupedContract = oc.$meta({ requestName: requestName } as const)
	.route({ method: 'POST', path: `/${requestName}`, operationId: 'post___' + requestName.replaceAll('/', '___'), tags: ['account', 'notifications'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors(commonErrors)
	.input(notificationListInput)
	.output(v.array(packedNotificationSchema));
