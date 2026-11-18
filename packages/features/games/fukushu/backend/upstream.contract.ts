/*
 * SPDX-FileCopyrightText: misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as v from 'valibot';
import { oc } from '@orpc/contract';
import { objectInput } from '../../../api/backend/transport/input.schema.js';
import { apiErrorData, commonErrors } from '../../../api/backend/transport/errors.schema.js';
import { upstreamStoreSchemas as s } from '../shared/upstream-records.schema.js';
import { studyRatingSchema, studyRequestIdSchema } from '../shared/study.schema.js';
import type { ApiProcedureMetadata } from '../../../api/backend/transport/policy.types.js';
import type { Meta } from '@orpc/contract';

const integer = v.pipe(v.number(), v.safeInteger(), v.minValue(0), v.maxValue(2_147_483_647));
const historyCursor = v.object({ time: v.pipe(v.string(), v.isoTimestamp()), key: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)) });
const historyPage = v.object({
	deckId: v.optional(v.string()), after: v.optional(historyCursor),
	day: v.optional(v.object({ start: v.pipe(v.string(), v.isoTimestamp()), end: v.pipe(v.string(), v.isoTimestamp()) })),
});
export type SourceHistoryPage = v.InferOutput<typeof historyPage>;
const backup = { requireCredential: true, secure: true, limit: { duration: 60000, max: 5 } } as const;
const base = oc.errors({ ...commonErrors,
																									NO_SUCH_FILE: { status: 404, data: apiErrorData }, NO_SUCH_MATERIAL: { status: 404, data: apiErrorData },
																									BACKUP_FAILED: { status: 400, data: apiErrorData }, INVALID_BACKUP: { status: 400, data: apiErrorData },
																									BACKUP_TOO_LARGE: { status: 400, data: apiErrorData }, BACKUP_CONFLICT: { status: 409, data: apiErrorData },
																									UPSTREAM_INSPECTION_LIMIT: { status: 400, data: apiErrorData },
																									STUDY_CONFLICT: { status: 409, data: apiErrorData }, STUDY_UNAVAILABLE: { status: 409, data: apiErrorData },
});
export const upstreamContract = {
	upstreamRestoreJob: base.$meta({ ...backup, requestName: 'fukushu/upstream/restore-job', limit: { duration: 60000, max: 30 } } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/upstream/restore-job', tags: ['fukushu'] })
		.input(objectInput({ fileId: v.pipe(v.string(), v.metadata({ format: 'misskey:id' })), requestId: studyRequestIdSchema, confirmRestore: v.literal(true), statusOnly: v.optional(v.boolean()) }))
		.output(v.object({ status: v.picklist(['waiting', 'running', 'completed', 'failed', 'missing']) })),
	upstreamMedia: base.$meta({ requireCredential: true, kind: 'read:account', requestName: 'fukushu/upstream/media', limit: { duration: 60000, max: 120 } } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/upstream/media', tags: ['fukushu'] })
		.input(objectInput({ id: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)) }))
		.output(v.object({ mimeType: v.string(), base64: v.string() })),
	upstreamUpdateGift: base.$meta({ ...backup, requestName: 'fukushu/upstream/update-gift' } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/upstream/update-gift', tags: ['fukushu'] })
		.input(objectInput({ deckId: v.string(), fileId: v.string(), confirmToken: v.optional(v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/))) }))
		.output(v.object({ token: v.string(), applied: v.boolean(), added: integer, changed: integer, disabled: integer, reset: integer })),
	upstreamRestore: base.$meta({ ...backup, requestName: 'fukushu/upstream/restore' } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/upstream/restore', tags: ['fukushu'] })
		.input(objectInput({ fileId: v.pipe(v.string(), v.metadata({ format: 'misskey:id' })), requestId: studyRequestIdSchema, confirmRestore: v.literal(true) }))
		.output(v.object({ restored: v.literal(true), sha256: v.string(), records: integer })),
	upstreamShow: base.$meta({ requireCredential: true, kind: 'read:account', requestName: 'fukushu/upstream/show', limit: { duration: 60000, max: 30 } } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/upstream/show', tags: ['fukushu'] }).input(objectInput({ page: v.optional(historyPage) }))
		.output(v.object({ records: v.object({ settings: v.array(s.settings), decks: v.array(s.decks), questions: v.array(s.questions), studyStates: v.array(s.studyStates), reviewLogs: v.array(s.reviewLogs), importSources: v.array(s.importSources), media: v.array(s.media), imports: v.array(s.imports) }), revisions: v.array(v.object({ questionId: v.string(), revision: integer })), historyPage: v.optional(v.object({ total: integer, next: v.nullable(historyCursor), today: v.array(v.string()) })) })),
	upstreamReview: base.$meta({ requireCredential: true, kind: 'write:account', requestName: 'fukushu/upstream/review', limit: { duration: 60000, max: 60 } } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/upstream/review', tags: ['fukushu'] })
		.input(objectInput({ requestId: studyRequestIdSchema, questionId: v.string(), expectedRevision: integer, rating: studyRatingSchema, correct: v.boolean(), answers: v.array(v.string()), durationMs: integer }))
		.output(v.object({ revision: integer, state: s.studyStates, record: s.reviewLogs })),
	upstreamExport: base.$meta({ ...backup, requestName: 'fukushu/upstream/export', limit: { duration: 86400000, max: 5 } } as const satisfies Meta & ApiProcedureMetadata)
		.route({ method: 'POST', path: '/fukushu/upstream/export', tags: ['fukushu'], successStatus: 204 })
		.input(objectInput({ acknowledgeDriveVisibility: v.literal(true) })).output(v.void()),
};
