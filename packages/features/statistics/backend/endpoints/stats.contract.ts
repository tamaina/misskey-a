/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { commonErrors } from '../../../api/backend/transport/errors.schema.js';

const finiteNumber = v.pipe(v.number(), v.finite());

const requestName = 'stats';
export const statsContract = oc.$meta({
	requestName: requestName,
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['meta'] })
	.errors(commonErrors)
	.input(v.optional(objectInput({}), {}))
	.output(v.strictObject({
		notesCount: finiteNumber,
		originalNotesCount: finiteNumber,
		usersCount: finiteNumber,
		originalUsersCount: finiteNumber,
		reactionsCount: finiteNumber,
		instances: finiteNumber,
		driveUsageLocal: finiteNumber,
		driveUsageRemote: finiteNumber,
	}));
