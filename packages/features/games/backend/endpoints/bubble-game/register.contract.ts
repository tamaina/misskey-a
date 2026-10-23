/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { jsonString } from '../../../../api/backend/transport/string.schema.js';

export const bubbleGameRegisterErrors = {
	invalidSeed: { message: 'Provided seed is invalid.', code: 'INVALID_SEED', id: 'eb627bc7-574b-4a52-a860-3c3eae772b88' },
} as const;

const requestName = 'bubble-game/register';
export const bubbleGameRegisterContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	kind: 'write:account',
	limit: {
		duration: 3_600_000,
		max: 120,
		minInterval: 30_000,
	},
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: [], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204, })
	.errors({ ...commonErrors, INVALID_SEED: { status: 400, data: apiErrorData } })
	.input(objectInput({
		"score": v.pipe(v.pipe(v.number(), v.integer()), v.minValue(0)),
		"seed": jsonString({ "minLength": 1, "maxLength": 1024 }),
		"logs": v.array(v.array(v.number())),
		"gameMode": v.string(),
		"gameVersion": v.pipe(v.number(), v.integer()),
	}))
	.output(v.void());
