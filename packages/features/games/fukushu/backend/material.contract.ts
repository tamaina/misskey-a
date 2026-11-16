/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import { oc } from '@orpc/contract';
import { misskeyId } from '../../../users/backend/users.input.schema.js';
import { commonErrors, apiErrorData } from '../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { materialSchema, deckSchema, sourceIdSchema } from '../shared/material.schema.js';
import type { ApiProcedureMetadata } from '../../../api/backend/transport/policy.types.js';
import type { Meta } from '@orpc/contract';

export const materialErrors = {
	NO_SUCH_FILE: { code: 'NO_SUCH_FILE', message: 'File is unavailable.', id: 'acbbd3fe-6697-4baf-85a6-20430f6e687f', status: 404 },
	IMPORT_FAILED: { code: 'IMPORT_FAILED', message: 'The original file could not be imported.', id: 'af0175e9-c747-467b-80de-497e2c59071b' },
	NO_SUCH_MATERIAL: { code: 'NO_SUCH_MATERIAL', message: 'Material is unavailable.', id: 'b42f989c-ce7b-41f0-8cad-aafc406df824', status: 404 },
	MATERIAL_EXISTS: { code: 'MATERIAL_EXISTS', message: 'A deck or card ID already exists.', id: 'f6f44cea-9401-4072-9f29-4ca79c9f2ca4', status: 409 },
	MATERIAL_LIMIT: { code: 'MATERIAL_LIMIT', message: 'Material limit reached.', id: '1dc3d592-122f-42d9-b181-79da9661fbcb' },
	INVALID_MATERIAL: { code: 'INVALID_MATERIAL', message: 'Unsupported or invalid material.', id: 'e850d217-1d44-4647-909a-f5a2a8eea394' },
} as const;

function contract<const Name extends 'create' | 'show' | 'list' | 'import'>(name: Name) {
	const write = name === 'create' || name === 'import';
	const requestName = `fukushu/materials/${name}` as const;
	return oc.$meta({ requestName, requireCredential: true, kind: write ? 'write:account' : 'read:account', limit: { duration: 60_000, max: write ? 5 : 60 } } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: `/${requestName}`, tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.errors({ ...commonErrors, NO_SUCH_FILE: { status: 404, data: apiErrorData }, IMPORT_FAILED: { status: 400, data: apiErrorData }, NO_SUCH_MATERIAL: { status: 404, data: apiErrorData }, MATERIAL_EXISTS: { status: 409, data: apiErrorData }, MATERIAL_LIMIT: { status: 400, data: apiErrorData }, INVALID_MATERIAL: { status: 400, data: apiErrorData } });
}

export const fukushuContract = {
	list: contract('list').input(objectInput({})).output(v.pipe(v.array(v.omit(deckSchema, ['sourceText'])), v.maxLength(100))),
	import: contract('import').input(objectInput({ fileId: misskeyId })).output(materialSchema),
	create: contract('create').input(objectInput({ material: materialSchema })).output(materialSchema),
	show: contract('show').input(objectInput({ id: sourceIdSchema })).output(materialSchema),
};
