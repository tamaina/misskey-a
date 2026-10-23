/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { packedReversiGameLiteSchema } from '../../reversi.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

const requestName = 'reversi/games';
export const reversiGamesContract = oc.$meta({
	requestName: requestName,
	requireCredential: false,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: [], })
	.errors(commonErrors)
	.input(objectInput({
		"limit": v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10),
		"sinceId": v.exactOptional(misskeyId),
		"untilId": v.exactOptional(misskeyId),
		"sinceDate": v.exactOptional(v.pipe(v.number(), v.integer())),
		"untilDate": v.exactOptional(v.pipe(v.number(), v.integer())),
		"my": v.optional(v.boolean(), false),
	}))
	.output(v.array(packedReversiGameLiteSchema));
