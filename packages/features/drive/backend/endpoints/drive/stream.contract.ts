/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

import { misskeyId } from '../../../../users/backend/users.input.schema.js';
import { packedDriveFileSchema } from '../../../../notes/backend/drive.schema.js';

export const driveStreamErrors = {} as const;
export const driveStreamContract = oc.$meta({
	requestName: 'drive/stream',
	'requireCredential': true,
	'kind': 'read:drive',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/drive/stream', tags: ['drive'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors }).input(objectInput({
		"limit": v.optional(v.pipe(v.pipe(v.number(), v.integer()), v.minValue(1), v.maxValue(100)), 10),
		"sinceId": v.exactOptional(misskeyId),
		"untilId": v.exactOptional(misskeyId),
		"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
		"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
		"type": v.exactOptional(v.pipe(v.string(), v.regex(new RegExp("^[a-zA-Z\\/\\-*]+$")))),
	})).output(v.array(packedDriveFileSchema));
