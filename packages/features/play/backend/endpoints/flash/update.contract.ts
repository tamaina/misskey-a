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
const misskeyId = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/));

export const flashUpdateErrors = {
	noSuchFlash: { message: 'No such flash.', code: 'NO_SUCH_FLASH', id: '611e13d2-309e-419a-a5e4-e0422da39b02' },
	accessDenied: { message: 'Access denied.', code: 'ACCESS_DENIED', id: '08e60c88-5948-478e-a132-02ec701d67b2' },
} as const;

const requestName = 'flash/update';
export const flashUpdateContract = oc.$meta({
	requestName: requestName,
	requireCredential: true,
	kind: 'write:flash',
	prohibitMoved: true,
	limit: { duration: 3_600_000, max: 300 },
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['flash'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }), successStatus: 204, })
	.errors({ ...commonErrors, NO_SUCH_FLASH: { status: 400, data: apiErrorData }, ACCESS_DENIED: { status: 400, data: apiErrorData } })
	.input(objectInput({
		"flashId": misskeyId,
		"title": v.exactOptional(v.string()),
		"summary": v.exactOptional(v.string()),
		"script": v.exactOptional(v.string()),
		"permissions": v.exactOptional(v.array(v.string())),
		"visibility": v.exactOptional(v.picklist(["public", "private"])),
	}))
	.output(v.void());
