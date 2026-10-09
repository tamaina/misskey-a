/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../../api/backend/transport/input.schema.js';

export const adminDriveCleanupErrors = {} as const;
export const adminDriveCleanupContract = oc.$meta({
	requestName: 'admin/drive/cleanup',
	'requireCredential': true,
	'requireModerator': true,
	'kind': 'write:admin:drive',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/admin/drive/cleanup', tags: ['admin'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204 })
	.errors({ ...commonErrors }).input(objectInput({})).output(v.void());
