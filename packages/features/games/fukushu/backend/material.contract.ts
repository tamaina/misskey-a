/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { oc } from '@orpc/contract';
import { commonErrors, apiErrorData } from '../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { materialSchema, sourceIdSchema } from '../shared/material.schema.js';
import type { ApiProcedureMetadata } from '../../../api/backend/transport/policy.types.js';
import type { Meta } from '@orpc/contract';

export const materialErrors = {
	NO_SUCH_MATERIAL: { code: 'NO_SUCH_MATERIAL', message: 'Material is unavailable.', id: 'b42f989c-ce7b-41f0-8cad-aafc406df824', status: 404 },
	MATERIAL_EXISTS: { code: 'MATERIAL_EXISTS', message: 'A deck or card ID already exists.', id: 'f6f44cea-9401-4072-9f29-4ca79c9f2ca4', status: 409 },
	MATERIAL_LIMIT: { code: 'MATERIAL_LIMIT', message: 'Material limit reached.', id: '1dc3d592-122f-42d9-b181-79da9661fbcb' },
	INVALID_MATERIAL: { code: 'INVALID_MATERIAL', message: 'Unsupported or invalid material.', id: 'e850d217-1d44-4647-909a-f5a2a8eea394' },
} as const;

function contract<const Name extends 'create' | 'show'>(name: Name) {
	const requestName = `fukushu/materials/${name}` as const;
	return oc.$meta({ requestName, requireCredential: true, kind: name === 'create' ? 'write:account' : 'read:account', limit: { duration: 60_000, max: name === 'create' ? 5 : 60 } } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: `/${requestName}`, tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors, NO_SUCH_MATERIAL: { status: 404, data: apiErrorData }, MATERIAL_EXISTS: { status: 409, data: apiErrorData }, MATERIAL_LIMIT: { status: 400, data: apiErrorData }, INVALID_MATERIAL: { status: 400, data: apiErrorData } });
}

export const fukushuContract = {
	create: contract('create').input(objectInput({ material: materialSchema })).output(materialSchema),
	show: contract('show').input(objectInput({ id: sourceIdSchema })).output(materialSchema),
};
