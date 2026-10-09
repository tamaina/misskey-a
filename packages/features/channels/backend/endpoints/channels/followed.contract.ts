/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { packedChannelSchema } from '../../channel.schema.js';
import { objectInput, misskeyId } from '../../request.schema.js';

export const channelsFollowedErrors = {} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const channelsFollowedContract = oc.$meta({
	requestName: 'channels/followed',
	requireCredential: true,
	kind: 'read:channels',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/channels/followed', tags: ['channels', 'account'], spec: current => ({ ...current, security }) })
	.errors({ ...commonErrors })
	.input(objectInput({
		"sinceId": v.exactOptional(misskeyId),
		"untilId": v.exactOptional(misskeyId),
		"sinceDate": v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
		"untilDate": v.exactOptional(v.pipe(v.pipe(v.number(), v.finite()), v.integer())),
		"limit": v.optional(v.pipe(v.pipe(v.pipe(v.number(), v.finite()), v.integer()), v.minValue(1), v.maxValue(100)), 5),
	})).output(v.array(packedChannelSchema));
