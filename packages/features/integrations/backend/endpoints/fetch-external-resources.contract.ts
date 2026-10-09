/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { commonErrors, apiErrorData } from '../../../api/backend/transport/errors.schema.js';

export const fetchExternalResourcesErrors = {
		invalidSchema: {
			message: 'External resource returned invalid schema.',
			code: 'EXT_RESOURCE_RETURNED_INVALID_SCHEMA',
			id: 'bb774091-7a15-4a70-9dc5-6ac8cf125856',
		},
		hashUnmached: {
			message: 'Hash did not match.',
			code: 'EXT_RESOURCE_HASH_DIDNT_MATCH',
			id: '693ba8ba-b486-40df-a174-72f8279b56a4',
		},
	} as const;

const requestName = 'fetch-external-resources';
export const fetchExternalResourcesContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	secure: true,
	limit: {
		duration: 3600000,
		max: 50,
	},
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['meta'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, EXT_RESOURCE_RETURNED_INVALID_SCHEMA: { status: 400, data: apiErrorData }, EXT_RESOURCE_HASH_DIDNT_MATCH: { status: 400, data: apiErrorData } })
	.input(objectInput({
	"url": v.string(),
	"hash": v.string(),
})).output(v.strictObject({
	"type": v.string(),
	"data": v.string(),
}));
