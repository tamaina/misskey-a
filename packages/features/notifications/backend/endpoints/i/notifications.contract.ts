/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { packedNotificationSchema } from '../../notification.schema.js';
import { notificationListInput } from './notification-input.schema.js';

const requestName = 'i/notifications';
export const listContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	kind: 'read:notifications',
	limit: { duration: 30000, max: 30 },
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['account', 'notifications'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors(commonErrors)
	.input(notificationListInput)
	.output(v.array(packedNotificationSchema));
