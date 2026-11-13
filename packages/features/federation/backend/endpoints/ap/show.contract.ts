/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../api/backend/transport/policy.types.js';
import { oc } from '@orpc/contract';
import * as v from 'valibot';
import { objectInput } from '../../../../api/backend/transport/input.schema.js';
import { commonErrors, apiErrorData } from '../../../../api/backend/transport/errors.schema.js';
import { packedUserDetailedNotMeSchema } from '../../../../users/backend/user.schema.js';
import { packedNoteSchema } from '../../../../notes/backend/note.schema.js';

export const apShowErrors = {
		federationNotAllowed: {
			message: 'Federation for this host is not allowed.',
			code: 'FEDERATION_NOT_ALLOWED',
			id: '974b799e-1a29-4889-b706-18d4dd93e266',
		},
		uriInvalid: {
			message: 'URI is invalid.',
			code: 'URI_INVALID',
			id: '1a5eab56-e47b-48c2-8d5e-217b897d70db',
		},
		requestFailed: {
			message: 'Request failed.',
			code: 'REQUEST_FAILED',
			id: '81b539cf-4f57-4b29-bc98-032c33c0792e',
		},
		responseInvalid: {
			message: 'Response from remote server is invalid.',
			code: 'RESPONSE_INVALID',
			id: '70193c39-54f3-4813-82f0-70a680f7495b',
		},
		noSuchObject: {
			message: 'No such object.',
			code: 'NO_SUCH_OBJECT',
			id: 'dc94d745-1262-4e63-a17d-fecaa57efc82',
		},
	} as const;

const requestName = 'ap/show';
export const apShowContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	kind: 'read:account',
	limit: {
		duration: 3600000,
		max: 30,
	},
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['federation'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({ ...commonErrors, FEDERATION_NOT_ALLOWED: { status: 400, data: apiErrorData }, URI_INVALID: { status: 400, data: apiErrorData }, REQUEST_FAILED: { status: 400, data: apiErrorData }, RESPONSE_INVALID: { status: 400, data: apiErrorData }, NO_SUCH_OBJECT: { status: 400, data: apiErrorData } })
	.input(objectInput({
		uri: v.string(),
	})).output(v.variant('type', [v.strictObject({ type: v.literal('User'), object: packedUserDetailedNotMeSchema }), v.strictObject({ type: v.literal('Note'), object: packedNoteSchema })]));

export type ApShowInput = v.InferOutput<NonNullable<typeof apShowContract['~orpc']['inputSchema']>>;
export type ApShowOutput = v.InferOutput<NonNullable<typeof apShowContract['~orpc']['outputSchema']>>;
