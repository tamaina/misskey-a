/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';

import { oc } from '@orpc/contract';
import type { OpenAPI } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../../api/backend/transport/errors.schema.js';
import { objectInput, misskeyId } from '../../../request.schema.js';

export const channelsMuteCreateErrors = {
		noSuchChannel: {
			message: 'No such Channel.',
			code: 'NO_SUCH_CHANNEL',
			id: '7174361e-d58f-31d6-2e7c-6fb830786a3f',
		},
		alreadyMuting: {
			message: 'You are already muting that user.',
			code: 'ALREADY_MUTING_CHANNEL',
			id: '5a251978-769a-da44-3e89-3931e43bb592',
		},
		expiresAtIsPast: {
			message: 'Cannot set past date to "expiresAt".',
			code: 'EXPIRES_AT_IS_PAST',
			id: '42b32236-df2c-a45f-fdbf-def67268f749',
		},
	} as const;

const security: OpenAPI.SecurityRequirementObject[] = [{ bearerAuth: [] }];
export const channelsMuteCreateContract = oc.$meta({
	requestName: 'channels/mute/create',
	requireCredential: true,
	prohibitMoved: true,
	kind: 'write:channels',
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: '/channels/mute/create', tags: ['channels', 'mute'], spec: current => ({ ...current, security }), successStatus: 204 })
	.errors({ ...commonErrors, NO_SUCH_CHANNEL: { status: 400, data: apiErrorData }, ALREADY_MUTING_CHANNEL: { status: 400, data: apiErrorData }, EXPIRES_AT_IS_PAST: { status: 400, data: apiErrorData } })
	.input(objectInput({ channelId: misskeyId, expiresAt: v.pipe(v.exactOptional(v.nullable(v.pipe(v.number(), v.finite(), v.integer()))), v.metadata({ description: 'A Unix Epoch timestamp that must lie in the future. `null` means an indefinite mute.' })) })).output(v.void());
