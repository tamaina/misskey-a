/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Meta } from '@orpc/contract';
import type { ApiProcedureMetadata } from '../../../../../api/backend/transport/policy.types.js';
import { oc, type InferSchemaOutput } from '@orpc/contract';
import { apiErrorData, commonErrors } from '../../../../../api/backend/transport/errors.schema.js';
import * as v from 'valibot';
import { imageComment } from './create.schema.js';

const finiteNumber = v.pipe(v.number(), v.finite());

const requestName = 'drive/files/create';
const base = oc.$meta({
	requestName: requestName,
	multipart: true,
	requireCredential: true,
	kind: 'write:drive',
	limit: {
				key: 'drive/files/create', duration: 3600000, max: 120,
			},
	prohibitMoved: true,
} as const satisfies Meta & ApiProcedureMetadata)
	.route({ method: 'POST', path: `/${requestName}`, tags: ['drive'], description: 'Upload a new drive file. Requires write:drive permission.', spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
	.errors({
		...commonErrors,
		FILE_REQUIRED: { status: 400, data: apiErrorData },
		INVALID_FILE_NAME: { status: 400, data: apiErrorData },
		INAPPROPRIATE: { status: 400, data: apiErrorData },
		NO_FREE_SPACE: { status: 400, data: apiErrorData },
		MAX_FILE_SIZE_EXCEEDED: { status: 413, data: apiErrorData },
		UNALLOWED_FILE_TYPE: { status: 400, data: apiErrorData },
	});

/** Portable SDK/OpenAPI contract. No server path or resource enters this graph. */
export const driveCreateContract = base
	.input(v.object({
		folderId: v.optional(v.nullable(v.pipe(v.string(), v.regex(/^[a-zA-Z0-9]+$/))), null),
		name: v.optional(v.nullable(v.string()), null),
		comment: v.optional(v.nullable(imageComment), null),
		isSensitive: v.optional(v.boolean(), false),
		force: v.optional(v.boolean(), false),
		file: v.blob(),
	}))
	.output(v.strictObject({
		id: v.string(),
		createdAt: v.string(),
		name: v.string(),
		type: v.string(),
		md5: v.string(),
		size: finiteNumber,
		isSensitive: v.boolean(),
		blurhash: v.nullable(v.string()),
		properties: v.strictObject({
			width: v.optional(finiteNumber),
			height: v.optional(finiteNumber),
			orientation: v.optional(finiteNumber),
			avgColor: v.optional(v.string()),
		}),
		url: v.string(),
		thumbnailUrl: v.nullable(v.string()),
		comment: v.nullable(v.string()),
		folderId: v.nullable(v.string()),
		folder: v.null(),
		userId: v.null(),
		user: v.null(),
	}));

export const drivePilotContract = { files: { create: driveCreateContract } };

/** Parsed native multipart fields, including their original defaults. */
export type DriveCreateWireInput = InferSchemaOutput<NonNullable<typeof driveCreateContract['~orpc']['inputSchema']>>;
/** Only attributes consumed by the service; upload resources remain in server context. */
export type DriveCreateInput = Omit<DriveCreateWireInput, 'file'>;
export type DriveCreateOutput = InferSchemaOutput<NonNullable<typeof driveCreateContract['~orpc']['outputSchema']>>;
