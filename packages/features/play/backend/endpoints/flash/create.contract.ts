/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { commonErrors } from '../../../../api/backend/transport/errors.schema.js';
import { packedFlashSchema } from '../../flash.schema.js';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';

const requestName = 'flash/create';
export const flashCreateContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	kind: 'write:flash',
	prohibitMoved: true,
	limit: { duration: 3_600_000, max: 10 },
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['flash'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), })
	.errors(commonErrors)
	.input(objectInput({
		"title": v.string(),
		"summary": v.string(),
		"script": v.string(),
		"permissions": v.array(v.string()),
		"visibility": v.optional(v.picklist(["public", "private"]), "public"),
	}))
	.output(packedFlashSchema);
