/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { upstreamContract } from './upstream.contract.js';
import * as v from 'valibot';
import { oc } from '@orpc/contract';
import { misskeyId } from '../../../users/backend/users.input.schema.js';
import { commonErrors, apiErrorData } from '../../../api/backend/transport/errors.schema.js';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { materialSchema, deckSchema, sourceIdSchema, questionSchema, plainContentSchema } from '../shared/material.schema.js';
import { backupContract } from './backup.contract.js';
import { studyContract } from './study.contract.js';
import { ankiMediaAssetSchema, ankiMediaIdSchema } from '../shared/anki-media.schema.js';
import type { ApiProcedureMetadata } from '../../../api/backend/transport/policy.types.js';
import type { Meta } from '@orpc/contract';

export const materialErrors = {
	CARD_HISTORY_LIMIT: { code: 'CARD_HISTORY_LIMIT', message: 'Card version history limit reached.', id: '628ad4f5-c799-4ebd-b65e-81be7e8601bd' },
	MATERIAL_CONFLICT: { code: 'MATERIAL_CONFLICT', message: 'Material changed. Reload before editing.', id: '025d9358-a9b8-46a2-8873-19a4733aa391', status: 409 },
	NO_SUCH_FILE: { code: 'NO_SUCH_FILE', message: 'File is unavailable.', id: 'acbbd3fe-6697-4baf-85a6-20430f6e687f', status: 404 },
	IMPORT_FAILED: { code: 'IMPORT_FAILED', message: 'The original file could not be imported.', id: 'af0175e9-c747-467b-80de-497e2c59071b' },
	NO_SUCH_MATERIAL: { code: 'NO_SUCH_MATERIAL', message: 'Material is unavailable.', id: 'b42f989c-ce7b-41f0-8cad-aafc406df824', status: 404 },
	MATERIAL_EXISTS: { code: 'MATERIAL_EXISTS', message: 'A deck or card ID already exists.', id: 'f6f44cea-9401-4072-9f29-4ca79c9f2ca4', status: 409 },
	MATERIAL_LIMIT: { code: 'MATERIAL_LIMIT', message: 'Material limit reached.', id: '1dc3d592-122f-42d9-b181-79da9661fbcb' },
	INVALID_MATERIAL: { code: 'INVALID_MATERIAL', message: 'Unsupported or invalid material.', id: 'e850d217-1d44-4647-909a-f5a2a8eea394' },
} as const;

const base = oc.errors({ ...commonErrors, CARD_HISTORY_LIMIT: { status: 400, data: apiErrorData }, MATERIAL_CONFLICT: { status: 409, data: apiErrorData }, NO_SUCH_FILE: { status: 404, data: apiErrorData }, IMPORT_FAILED: { status: 400, data: apiErrorData }, NO_SUCH_MATERIAL: { status: 404, data: apiErrorData }, MATERIAL_EXISTS: { status: 409, data: apiErrorData }, MATERIAL_LIMIT: { status: 400, data: apiErrorData }, INVALID_MATERIAL: { status: 400, data: apiErrorData } });
const read = { requireCredential: true, kind: 'read:account', limit: { duration: 60_000, max: 60 } } as const;
const write = { requireCredential: true, kind: 'write:account', limit: { duration: 60_000, max: 5 } } as const;

export const revisionSchema = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(2_147_483_647));
export const managementSchema = v.strictObject({ revision: revisionSchema, archivedAt: v.nullable(v.pipe(v.string(), v.isoTimestamp())) });
export const metadataSchema = v.strictObject({ name: deckSchema.entries.name, description: deckSchema.entries.description });
const managedMaterialSchema = v.pipe(v.strictObject({ ...materialSchema.entries, ...managementSchema.entries }),
	v.check(({ deck, questions }) => v.safeParse(materialSchema, { deck, questions }).success, 'Invalid material'));

export const explanationUpdateSchema = v.nullable(plainContentSchema.entries.value);
export const cardVersionPageSchema = v.strictObject({
	before: v.optional(revisionSchema),
	limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(20)), 20),
});
const cardVersionSummarySchema = v.strictObject({
	version: revisionSchema,
	recordedAt: v.nullable(v.pipe(v.string(), v.isoTimestamp())),
	kind: v.picklist(['baseline', 'explanation']),
});

// Keep requestName literal at each declaration: SDK endpoints are keyed by this metadata.
const reminderSettings = v.strictObject({ localTime: v.pipe(v.string(), v.regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)), zone: v.pipe(v.string(), v.minLength(1), v.maxLength(128)) });
export const fukushuContract = {
	reminderShow: oc.errors(commonErrors).$meta({ ...read, secure: true, requestName: 'fukushu/reminder/show' } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/reminder/show', tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.input(objectInput({})).output(v.strictObject({ schedule: v.nullable(reminderSettings) })),
	reminderUpdate: oc.errors({ ...commonErrors, INVALID_REMINDER_SCHEDULE: { status: 400, data: apiErrorData } }).$meta({ ...write, secure: true, requestName: 'fukushu/reminder/update' } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/reminder/update', tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.input(objectInput({ schedule: v.nullable(reminderSettings) })).output(v.void()),
	...studyContract,
	...backupContract,
	...upstreamContract,
	list: base.$meta({ ...read, requestName: 'fukushu/materials/list' } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/materials/list', tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.input(objectInput({ archived: v.optional(v.boolean(), false) })).output(v.pipe(v.array(v.omit(deckSchema, ['sourceText'])), v.maxLength(100))),
	import: base.$meta({ ...write, requestName: 'fukushu/materials/import' } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/materials/import', tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.input(objectInput({ fileId: misskeyId })).output(materialSchema),
	create: base.$meta({ ...write, requestName: 'fukushu/materials/create' } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/materials/create', tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.input(objectInput({ material: materialSchema })).output(materialSchema),
	show: base.$meta({ ...read, requestName: 'fukushu/materials/show' } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/materials/show', tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.input(objectInput({ id: sourceIdSchema })).output(managedMaterialSchema),
	ankiMedia: base.$meta({ ...read, secure: true, requestName: 'fukushu/materials/anki-media' } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/materials/anki-media', tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.input(objectInput({ id: sourceIdSchema, mediaId: ankiMediaIdSchema })).output(ankiMediaAssetSchema),
	update: base.$meta({ ...write, requestName: 'fukushu/materials/update' } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/materials/update', tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.input(objectInput({ id: sourceIdSchema, expectedRevision: revisionSchema, ...metadataSchema.entries })).output(managementSchema),
	updateCardExplanation: base.$meta({ ...write, requestName: 'fukushu/materials/update-card-explanation' } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/materials/update-card-explanation', tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.input(objectInput({ id: sourceIdSchema, questionId: sourceIdSchema, expectedRevision: revisionSchema, explanation: explanationUpdateSchema }))
		.output(v.strictObject({ ...managementSchema.entries, version: revisionSchema })),
	listCardVersions: base.$meta({ ...read, requestName: 'fukushu/materials/card-versions' } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/materials/card-versions', tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.input(objectInput({ id: sourceIdSchema, questionId: sourceIdSchema, ...cardVersionPageSchema.entries }))
		.output(v.strictObject({ currentVersion: revisionSchema, versions: v.pipe(v.array(cardVersionSummarySchema), v.maxLength(20)) })),
	showCardVersion: base.$meta({ ...read, requestName: 'fukushu/materials/card-version' } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/materials/card-version', tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.input(objectInput({ id: sourceIdSchema, questionId: sourceIdSchema, version: revisionSchema }))
		.output(v.strictObject({ ...cardVersionSummarySchema.entries, question: questionSchema })),
	archive: base.$meta({ ...write, requestName: 'fukushu/materials/archive' } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/materials/archive', tags: ['fukushu'], spec: current => ({ ...current, security: [{ bearerAuth: [] }] }) })
		.input(objectInput({ id: sourceIdSchema, expectedRevision: revisionSchema, archived: v.boolean() })).output(managementSchema),
};
